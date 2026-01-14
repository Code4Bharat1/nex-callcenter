import React, { useEffect, useRef, useState } from 'react';
import { useAudioLevel } from '../hooks/useAudioLevel';
import './AIOrb.css';

const AIOrb = ({ isActive, audioStream }) => {
  const { levelRef, ready, error, start, stop } = useAudioLevel();
  const [level, setLevel] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const shaderProgramRef = useRef(null);
  const glRef = useRef(null);

  // Start audio when stream is available
  useEffect(() => {
    if (isActive && audioStream && !ready) {
      console.log('[AIOrb] Starting audio with stream:', audioStream);
      start(audioStream);
    } else if (!isActive) {
      stop();
    }
    return () => {
      if (!isActive) stop();
    };
  }, [isActive, audioStream, ready, start, stop]);
  
  // Debug logging
  useEffect(() => {
    if (isActive) {
      console.log('[AIOrb] Active:', isActive, 'Ready:', ready, 'Level:', level);
    }
  }, [isActive, ready, level]);

  // Smooth level updates
  useEffect(() => {
    if (!ready) return;

    const update = () => {
      setLevel(prev => prev + (levelRef.current - prev) * 0.25);
      animationRef.current = requestAnimationFrame(update);
    };

    update();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ready, levelRef]);

  // WebGL shader setup
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported, using fallback rendering');
      setWebglSupported(false);
      return;
    }
    
    // Set canvas size first
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    setWebglSupported(true);

    glRef.current = gl;

    // Vertex shader
    const vertexShaderSource = `#version 100
      attribute vec2 a_position;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader with iridescent effect - fixed syntax
    const fragmentShaderSource = `#version 100
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec2 uResolution;
      uniform float uAmplitude;
      uniform float uSpeed;
      varying vec2 v_uv;

      void main() {
        float mr = min(uResolution.x, uResolution.y);
        vec2 uv = (v_uv * 2.0 - 1.0) * uResolution.xy / mr;
        
        float d = -uTime * 0.5 * uSpeed;
        float a = 0.0;
        
        for (float i = 0.0; i < 8.0; i = i + 1.0) {
          a = a + cos(i - d - a * uv.x);
          d = d + sin(uv.y * i + a);
        }
        
        vec2 uvMult = vec2(d, a);
        float cosUv = cos(uv.x * uvMult.x + uv.y * uvMult.y);
        float cosAd = cos(a + d);
        
        vec3 col = vec3(
          cosUv * 0.6 + 0.4,
          cosUv * 0.6 + 0.4,
          cosAd * 0.5 + 0.5
        );
        
        vec3 cosVec = vec3(cos(d), cos(a), cos(2.5));
        col = cos(col * cosVec * 0.5 + 0.5) * uColor;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      if (!shader) {
        console.error('Failed to create shader');
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const errorLog = gl.getShaderInfoLog(shader);
        console.error('Shader compile error:', errorLog || 'Unknown error');
        console.error('Shader source:', source);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const createProgram = (gl, vertexShader, fragmentShader) => {
      if (!vertexShader || !fragmentShader) {
        console.error('Cannot create program: missing shaders');
        return null;
      }
      const program = gl.createProgram();
      if (!program) {
        console.error('Failed to create program');
        return null;
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const errorLog = gl.getProgramInfoLog(program);
        console.error('Program link error:', errorLog || 'Unknown error');
        gl.deleteProgram(program);
        return null;
      }
      return program;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders, using fallback');
      setWebglSupported(false);
      return;
    }
    
    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) {
      console.error('Failed to create program, using fallback');
      setWebglSupported(false);
      return;
    }

    shaderProgramRef.current = program;

    // Full-screen triangle
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
       3, -1, 2, 0,
      -1,  3, 0, 2,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const uvLocation = gl.getAttribLocation(program, 'a_uv');
    
    if (positionLocation === -1 || uvLocation === -1) {
      console.error('Failed to get attribute locations');
      setWebglSupported(false);
      return;
    }

    const resize = () => {
      if (!canvas || !gl) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId = null;
    
    const animate = () => {
      if (!shaderProgramRef.current || !gl || !program) {
        setWebglSupported(false);
        return;
      }

      try {
        time += 0.016; // ~60fps

        gl.useProgram(program);

        const amplitude = 0.18 + level * 1.7;
        const speed = 0.75 + level * 0.5;

        const timeLoc = gl.getUniformLocation(program, 'uTime');
        const colorLoc = gl.getUniformLocation(program, 'uColor');
        const resLoc = gl.getUniformLocation(program, 'uResolution');
        const ampLoc = gl.getUniformLocation(program, 'uAmplitude');
        const speedLoc = gl.getUniformLocation(program, 'uSpeed');

        if (timeLoc) gl.uniform1f(timeLoc, time);
        if (colorLoc) gl.uniform3f(colorLoc, 0.3, 0.6, 1.0);
        if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);
        if (ampLoc) gl.uniform1f(ampLoc, amplitude);
        if (speedLoc) gl.uniform1f(speedLoc, speed);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(uvLocation);
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        animationId = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Animation error:', error);
        setWebglSupported(false);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (gl && gl.getExtension('WEBGL_lose_context')) {
        try {
          gl.getExtension('WEBGL_lose_context').loseContext();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isActive, level]);

  if (!isActive) return null;

  const amplitude = 0.18 + level * 1.7;
  const scale = 1 + level * 0.35;
  const glowOpacity = 0.25 + level * 2.45;

  return (
    <div className={`ai-orb-container ${isDark ? 'ai-orb-dark' : 'ai-orb-light'}`}>
      <div className="ai-orb-wrapper">
        <div 
          className="ai-orb-glow" 
          style={{ opacity: Math.min(1, glowOpacity) }}
        />
        <div 
          className="ai-orb-canvas-wrapper"
          style={{ transform: `scale(${scale})`, transition: 'transform 0.12s ease-out' }}
        >
          {webglSupported ? (
            <canvas ref={canvasRef} className="ai-orb-canvas" />
          ) : (
            <div className="ai-orb-fallback">
              <div 
                className="ai-orb-fallback-inner"
                style={{ 
                  transform: `scale(${scale})`,
                  background: `radial-gradient(circle, rgba(99, 102, 241, ${0.8 + level * 0.2}) 0%, rgba(139, 92, 246, ${0.4 + level * 0.3}) 50%, transparent 100%)`
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="ai-orb-controls">
        {!ready && !error && (
          <button onClick={() => start(audioStream)} className="ai-orb-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Enable Microphone
          </button>
        )}
        {error && <div className="ai-orb-error">Audio error: {error}</div>}
        <button 
          onClick={() => setIsDark(prev => !prev)} 
          className="ai-orb-toggle"
        >
          {isDark ? 'SWITCH TO LIGHT' : 'SWITCH TO DARK'}
        </button>
        {ready && <div className="ai-orb-status">ENGINE: ACTIVE</div>}
      </div>
    </div>
  );
};

export default AIOrb;
