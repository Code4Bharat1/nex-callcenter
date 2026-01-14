import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import { SkeletonTTSProviders } from '../components/SkeletonLoader';
import './Voices.css';

// Gradient URLs from Figma design (100 gradients total)
const GRADIENT_URLS = [
  "https://www.figma.com/api/mcp/asset/4a6a3aac-d264-451d-9194-168f6bb76b4d",
  "https://www.figma.com/api/mcp/asset/9712e83e-d89b-42df-a2ed-7d17d1f48b96",
  "https://www.figma.com/api/mcp/asset/11d5f179-3aa8-4608-93e6-ceba574209fa",
  "https://www.figma.com/api/mcp/asset/f78f83fe-759c-4936-aee7-d7b337a744ef",
  "https://www.figma.com/api/mcp/asset/484c3a28-b7e5-4e40-9b20-d012391566ba",
  "https://www.figma.com/api/mcp/asset/00c7c924-0573-4c4b-af06-acd574e686c3",
  "https://www.figma.com/api/mcp/asset/1f060be8-6e04-4521-9b28-becc682f8521",
  "https://www.figma.com/api/mcp/asset/6db15519-e6b9-4642-80e1-9f7b81ff21dc",
  "https://www.figma.com/api/mcp/asset/afcf8040-42b5-45e7-b7bc-7f936ca879a3",
  "https://www.figma.com/api/mcp/asset/49790bf9-60f1-421f-b14d-edeb02b49a5a",
  "https://www.figma.com/api/mcp/asset/eb484618-39ca-4b94-b262-50d13697fb66",
  "https://www.figma.com/api/mcp/asset/c7e06a9d-18cf-4b69-b4f5-c2287b36f54b",
  "https://www.figma.com/api/mcp/asset/6a8c306b-aa17-4da0-9002-44ad5c08e4bc",
  "https://www.figma.com/api/mcp/asset/46fb8eb5-50b3-4a27-84ca-6bc4ee73a070",
  "https://www.figma.com/api/mcp/asset/3c7cdaaf-696b-4553-a8ef-0c6649642568",
  "https://www.figma.com/api/mcp/asset/4398b378-26f6-4446-a64e-4123127a2f5c",
  "https://www.figma.com/api/mcp/asset/d2ade1a1-3801-4dd1-9880-4f46248620c1",
  "https://www.figma.com/api/mcp/asset/24c1fd26-66c3-4ae0-8b03-e37a9919d957",
  "https://www.figma.com/api/mcp/asset/0ab2eecc-8f8e-4977-b8d2-739a666fe5ae",
  "https://www.figma.com/api/mcp/asset/447117a7-1977-4351-91a9-201c00c1720d",
  "https://www.figma.com/api/mcp/asset/ce400813-9240-4385-b2f5-b2a757eeaf82",
  "https://www.figma.com/api/mcp/asset/da2a9b03-cbb9-4d86-8a95-0aee0b606859",
  "https://www.figma.com/api/mcp/asset/6b6fa9fd-c9d1-4ecf-94d7-57c6f1a67095",
  "https://www.figma.com/api/mcp/asset/5b72270a-29e4-4dca-9498-c472249893ab",
  "https://www.figma.com/api/mcp/asset/6248bc73-b21d-49a8-93fd-2e84268be766",
  "https://www.figma.com/api/mcp/asset/0f59208f-61f9-44a6-b4f4-07a68ec0ad62",
  "https://www.figma.com/api/mcp/asset/959663d3-a23a-4b68-b16f-309b978d1072",
  "https://www.figma.com/api/mcp/asset/38976daf-3ae1-407f-97a8-002c987794f7",
  "https://www.figma.com/api/mcp/asset/a5e12fe2-e6ed-4a53-ae98-aa8b9fea5932",
  "https://www.figma.com/api/mcp/asset/a8b73658-83bb-406b-967e-5250908415ae",
  "https://www.figma.com/api/mcp/asset/8cce15b6-3823-4ca3-9d96-6f4a7a5dfa99",
  "https://www.figma.com/api/mcp/asset/c417c66f-8c47-4cda-a415-fac7e90c466d",
  "https://www.figma.com/api/mcp/asset/da485ff0-8fba-4d67-8fd9-4f5ca391df81",
  "https://www.figma.com/api/mcp/asset/6c65b6a1-c8a6-4354-a224-dd76c36f5371",
  "https://www.figma.com/api/mcp/asset/32843660-325d-4bb2-bcc8-3fb922dae316",
  "https://www.figma.com/api/mcp/asset/53140b5a-5702-40c1-ba4e-699b97d28e1a",
  "https://www.figma.com/api/mcp/asset/acc947a7-4846-4dbf-9e45-255dabc50f56",
  "https://www.figma.com/api/mcp/asset/0522a8b0-ff06-4fb7-97dd-42e9afc8dee2",
  "https://www.figma.com/api/mcp/asset/cf925875-b1d8-4b49-9df3-b2ad77f48101",
  "https://www.figma.com/api/mcp/asset/35bfbabd-4bbb-43c5-a0a5-79f6c46d4bf4",
  "https://www.figma.com/api/mcp/asset/1a007697-a8d5-4e1a-9d74-161b2bd656db",
  "https://www.figma.com/api/mcp/asset/e16e30ec-9928-4c2c-a9f1-fe10144c341d",
  "https://www.figma.com/api/mcp/asset/d96ca602-2f64-4fc8-994d-71117c321543",
  "https://www.figma.com/api/mcp/asset/38f215f6-1ffa-4300-9679-23af55e3c302",
  "https://www.figma.com/api/mcp/asset/7c7eab83-d036-4447-9415-91b337c53830",
  "https://www.figma.com/api/mcp/asset/8c98dc0f-14bc-452b-a58b-d773e4e19d93",
  "https://www.figma.com/api/mcp/asset/382402dc-b554-4ae7-aa15-a1e9debdc05b",
  "https://www.figma.com/api/mcp/asset/10bf53f5-d95a-43a7-adcf-44a1aafaea6c",
  "https://www.figma.com/api/mcp/asset/1da2517e-b37c-492d-85b7-d73b86bc870f",
  "https://www.figma.com/api/mcp/asset/3f01447d-ad78-4c33-9956-7178ce5ee803",
  "https://www.figma.com/api/mcp/asset/c51f7b9a-0bfb-4142-83e4-fc5e6546c209",
  "https://www.figma.com/api/mcp/asset/62fefeb5-b3ff-4908-947f-a48f510dd170",
  "https://www.figma.com/api/mcp/asset/06d31ae6-5e17-4ce2-8eeb-f1ab5397a667",
  "https://www.figma.com/api/mcp/asset/4f0c2100-a4e1-480f-81b4-a5d3d101d774",
  "https://www.figma.com/api/mcp/asset/8b9d285e-419b-47d6-a637-eb7721d36349",
  "https://www.figma.com/api/mcp/asset/14e795f8-a7d4-41d5-90d7-ad20293d8b49",
  "https://www.figma.com/api/mcp/asset/25eda155-3de6-4a8b-b724-f6b6f3a873a0",
  "https://www.figma.com/api/mcp/asset/3ce7219f-676d-445c-bfbb-ca09a7315d70",
  "https://www.figma.com/api/mcp/asset/2b1752e2-fbed-497e-8e0e-5b23b539715a",
  "https://www.figma.com/api/mcp/asset/a89e4251-e69e-4f60-b86c-fca0931b019a",
  "https://www.figma.com/api/mcp/asset/9920d777-817b-424e-9574-c67643bc477e",
  "https://www.figma.com/api/mcp/asset/f32091f6-624f-4ac2-8c37-eb338b42d3f4",
  "https://www.figma.com/api/mcp/asset/f6c543c3-1836-4978-8064-8ffddce58639",
  "https://www.figma.com/api/mcp/asset/c7202d00-b5c4-41f7-a3e8-a1258de77718",
  "https://www.figma.com/api/mcp/asset/40592040-fbd0-4f31-84e4-5428b4a0e5ab",
  "https://www.figma.com/api/mcp/asset/e73a8b9b-2558-4b30-8535-d88591e8dcac",
  "https://www.figma.com/api/mcp/asset/3d29d347-5503-4cdb-a6f6-8e08aa3b84d3",
  "https://www.figma.com/api/mcp/asset/9a6cd671-6ad4-4798-a9fc-6d75c6350411",
  "https://www.figma.com/api/mcp/asset/f1b8629f-c379-48e4-8a05-f32d5120cba6",
  "https://www.figma.com/api/mcp/asset/7e94d0f4-e094-472b-b28c-b8bf5b9bfaa6",
  "https://www.figma.com/api/mcp/asset/35308a6f-433e-4d03-a23b-9b633020ce1a",
  "https://www.figma.com/api/mcp/asset/b458236a-76de-40ca-9cf6-f3a4b0f43dd0",
  "https://www.figma.com/api/mcp/asset/4e71f533-32ee-4e2c-9fd1-5ac42eedb781",
  "https://www.figma.com/api/mcp/asset/f31f9599-5a16-4d11-856e-1057f6be2cab",
  "https://www.figma.com/api/mcp/asset/b32b9ffd-75d5-4bf2-bebe-8240b65d7459",
  "https://www.figma.com/api/mcp/asset/6081db6c-c334-4906-82ca-f002cb06d51b",
  "https://www.figma.com/api/mcp/asset/db08696f-d83a-405f-8ebb-9159bc06671c",
  "https://www.figma.com/api/mcp/asset/0e6e3593-5694-4438-a42b-b8508e637db1",
  "https://www.figma.com/api/mcp/asset/9f96e407-3f46-403b-93eb-8654d082890f",
  "https://www.figma.com/api/mcp/asset/7b86108b-2aee-47b3-9d2e-ee773776b27d",
  "https://www.figma.com/api/mcp/asset/675af60d-ce6d-4c58-9299-35097fae13d9",
  "https://www.figma.com/api/mcp/asset/9b79e54a-2943-4d2d-829c-3fc9f0654306",
  "https://www.figma.com/api/mcp/asset/83b8cc71-fd7c-4e98-86c3-29ca9b2707f7",
  "https://www.figma.com/api/mcp/asset/bc9d3e4c-b2f0-46f3-bf48-12759e36b4c1",
  "https://www.figma.com/api/mcp/asset/7f7fba9e-e92d-47a3-b877-29671a2d0226",
  "https://www.figma.com/api/mcp/asset/62557715-c83a-4c5d-96fe-3574783d710d",
  "https://www.figma.com/api/mcp/asset/f10522be-7504-4a7c-8fa7-e8f452bd258b",
  "https://www.figma.com/api/mcp/asset/5571b2e5-6954-4e25-a8ee-3112835687f9",
  "https://www.figma.com/api/mcp/asset/28463a63-988c-47bf-a037-a6a5d6b3cb57",
  "https://www.figma.com/api/mcp/asset/be757814-2ed8-4a63-b04a-5e36e3a6f770"
];

// Generate unique gradients programmatically to ensure no duplicates
const generateUniqueGradients = () => {
  const gradients = [];
  const used = new Set();
  
  // Color palettes for variety
  const colors = {
    reds: ['#FF6B6B', '#FF8A80', '#EF5350', '#E57373', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
    pinks: ['#F093FB', '#EC407A', '#E91E63', '#F48FB1', '#F06292', '#E91E63', '#C2185B', '#AD1457', '#880E4F'],
    oranges: ['#FFA726', '#FFB74D', '#FF9800', '#FF8F00', '#F57C00', '#E65100', '#FF7043', '#FF5722', '#E64A19', '#D84315', '#BF360C'],
    yellows: ['#FFD93D', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00', '#FAD961', '#F9A825'],
    greens: ['#66BB6A', '#81C784', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', '#43E97B', '#38F9D7', '#4ECDC4', '#44A08D'],
    teals: ['#26A69A', '#4DB6AC', '#009688', '#00897B', '#00796B', '#00695C', '#004D40', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064'],
    blues: ['#42A5F5', '#64B5F6', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#29B6F6', '#03A9F4', '#0288D1', '#0277BD', '#01579B', '#4FACFE', '#00F2FE', '#89F7FE', '#66A6FF'],
    purples: ['#AB47BC', '#BA68C8', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', '#5C6BC0', '#5E35B1', '#512DA8', '#4527A0', '#311B92', '#1A237E', '#7E57C2', '#673AB7', '#C471F5', '#FA71CD'],
    cyans: ['#26C6DA', '#4DD0E1', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', '#30CFD0', '#330867'],
    grays: ['#78909C', '#90A4AE', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238'],
    browns: ['#8D6E63', '#A1887F', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723']
  };
  
  // Generate unique combinations
  const allColors = [
    ...colors.reds, ...colors.pinks, ...colors.oranges, ...colors.yellows,
    ...colors.greens, ...colors.teals, ...colors.blues, ...colors.purples,
    ...colors.cyans, ...colors.grays, ...colors.browns
  ];
  
  // Create unique gradient pairs
  for (let i = 0; i < allColors.length; i++) {
    for (let j = i + 1; j < allColors.length; j++) {
      const gradient = [allColors[i], allColors[j]];
      const key = `${gradient[0]}-${gradient[1]}`;
      if (!used.has(key)) {
        gradients.push(gradient);
        used.add(key);
      }
    }
  }
  
  // Add reverse combinations for more variety
  const reverseGradients = [];
  for (const grad of gradients.slice(0, 200)) {
    const reversed = [grad[1], grad[0]];
    const key = `${reversed[0]}-${reversed[1]}`;
    if (!used.has(key)) {
      reverseGradients.push(reversed);
      used.add(key);
    }
  }
  
  return [...gradients, ...reverseGradients];
};

const GRADIENT_COLORS = generateUniqueGradients();

// Component-level tracking to ensure uniqueness per render cycle
let voiceGradientAssignments = new Map();
let usedGradientKeys = new Set();

// Better hash function using djb2 algorithm
const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Function to get a unique gradient for a voice based on its ID and name
const getVoiceGradient = (voiceId, voiceName = '') => {
  // Create a unique identifier from both ID and name
  const uniqueKey = `${voiceId}-${(voiceName || '').toLowerCase()}`;
  
  // Check if we already assigned a gradient to this voice
  if (voiceGradientAssignments.has(uniqueKey)) {
    return voiceGradientAssignments.get(uniqueKey);
  }
  
  // Find an unused gradient
  const hash = hashString(uniqueKey);
  let index = hash % GRADIENT_COLORS.length;
  let attempts = 0;
  const maxAttempts = GRADIENT_COLORS.length;
  
  // Find a gradient that hasn't been used yet
  while (attempts < maxAttempts) {
    const gradient = GRADIENT_COLORS[index];
    const gradientKey = `${gradient[0]}-${gradient[1]}`;
    
    // Check if this gradient is already used
    if (!usedGradientKeys.has(gradientKey)) {
      // Assign this gradient to the voice
      voiceGradientAssignments.set(uniqueKey, gradient);
      usedGradientKeys.add(gradientKey);
      return gradient;
    }
    
    // Try next gradient
    index = (index + 1) % GRADIENT_COLORS.length;
    attempts++;
  }
  
  // Fallback: use hash-based assignment (shouldn't happen with 500+ gradients)
  const fallbackIndex = hash % GRADIENT_COLORS.length;
  const gradient = GRADIENT_COLORS[fallbackIndex];
  voiceGradientAssignments.set(uniqueKey, gradient);
  const gradientKey = `${gradient[0]}-${gradient[1]}`;
  usedGradientKeys.add(gradientKey);
  return gradient;
};

// Reset gradient assignments when component mounts to ensure fresh assignment
const resetGradientAssignments = () => {
  voiceGradientAssignments.clear();
  usedGradientKeys.clear();
};

const Voices = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  // Reset gradient assignments on mount to ensure fresh assignment each time
  useEffect(() => {
    resetGradientAssignments();
  }, []);
  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [voices, setVoices] = useState([]);
  const [savedVoices, setSavedVoices] = useState([]);
  const [clonedVoices, setClonedVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVoiceForAssignment, setSelectedVoiceForAssignment] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedVoiceForPreview, setSelectedVoiceForPreview] = useState(null);
  const [voicePreviewText, setVoicePreviewText] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState({});
  const [playingAudio, setPlayingAudio] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceLanguages, setVoiceLanguages] = useState({}); // Track language selection per voice
  const [showPreviewSettings, setShowPreviewSettings] = useState(false);
  const [customEnglishText, setCustomEnglishText] = useState('Did you order uhh perfora toothpaste right? [laughter] uhh I just wanted to confirm these, and your address is near pretty day apartments. umm what is the landmark for the same? ');
  const [customHinglishText, setCustomHinglishText] = useState('Aapne Perfora toothpaste uhh order kiya tha, Bas address correct karna hai. uhh Aapka address Pretty Day Apartments ke paas  hai na? Aur uhh isme Landmark kya daalu?');
  const [editingVoice, setEditingVoice] = useState(null); // Track which voice is being edited
  const [editedVoiceName, setEditedVoiceName] = useState('');
  const [editedVoiceDescription, setEditedVoiceDescription] = useState('');
  const [voiceCustomizations, setVoiceCustomizations] = useState({}); // Store custom names/descriptions
  const [sortBy, setSortBy] = useState('trending'); // trending, newest, alphabetical
  const [showFilters, setShowFilters] = useState(false);
  const [useCaseScrollPosition, setUseCaseScrollPosition] = useState(0);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const audioRef = useRef(null);
  const useCasesCarouselRef = useRef(null);

  useEffect(() => {
    console.log('[Voices] Component mounted, loading Hindi/Indian voices. Shop:', shop);
    // Load Hindi/Indian voices by default without showing search query
    loadDefaultVoices();
    if (shop) {
      loadAgents();
    }
    loadSavedVoices();
    loadClonedVoices();
    
    // Listen for voice cloned event to refresh cloned voices
    const handleVoiceCloned = () => {
      console.log('[Voices] Voice cloned event received, refreshing cloned voices...');
      loadClonedVoices();
    };
    
    window.addEventListener('voiceCloned', handleVoiceCloned);
    
    // Load custom preview texts from localStorage
    const savedEnglish = localStorage.getItem('voicePreviewEnglish');
    const savedHinglish = localStorage.getItem('voicePreviewHinglish');
    if (savedEnglish) {
      setCustomEnglishText(savedEnglish);
    }
    if (savedHinglish) {
      setCustomHinglishText(savedHinglish);
    }
    
    // Load voice customizations from localStorage
    const savedCustomizations = localStorage.getItem('voiceCustomizations');
    if (savedCustomizations) {
      setVoiceCustomizations(JSON.parse(savedCustomizations));
    }
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('voiceCloned', handleVoiceCloned);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  // Handle use cases carousel scroll for smart fade
  useEffect(() => {
    const checkScrollPosition = () => {
      const container = useCasesCarouselRef.current;
      if (container) {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        setShowLeftFade(scrollLeft > 10);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    
    // Check initial scroll position after a delay
    setTimeout(checkScrollPosition, 100);
    
    const container = useCasesCarouselRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (playingAudio) {
        playingAudio.pause();
        playingAudio.currentTime = 0;
      }
    };
  }, [playingAudio]);

  const loadDefaultVoices = async () => {
    try {
      setLoading(true);
      // Load all voices (no search query) to get ultra realistic voices
      const response = shop ? await api.getVoices('', shop) : await api.getVoices('');
      if (response && response.voices) {
        // Include all voices - ultra realistic voices will be filtered in getFilteredVoices
        console.log('[Voices] ✅ Loaded', response.voices.length, 'voices from API');
        const ultraRealisticCount = response.voices.filter(v => v.isUltraRealistic).length;
        console.log('[Voices] 🌟 Ultra realistic voices found:', ultraRealisticCount);
        if (ultraRealisticCount > 0) {
          const ultraNames = response.voices.filter(v => v.isUltraRealistic).map(v => v.name);
          console.log('[Voices] 🌟 Ultra realistic voice names:', ultraNames.join(', '));
          console.log('[Voices] 🌟 Ultra realistic voice details:', 
            response.voices.filter(v => v.isUltraRealistic).map(v => ({
              name: v.name,
              id: v.id,
              isGlobal: v.isGlobal,
              isUltraRealistic: v.isUltraRealistic
            }))
          );
        } else {
          console.warn('[Voices] ⚠️  WARNING: No ultra realistic voices found in API response!');
          console.warn('[Voices] ⚠️  Check server logs or visit /api/debug/ultra-realistic-voices');
        }
        setVoices(response.voices);
      } else {
        console.error('[Voices] ❌ No voices in response:', response);
        setVoices([]);
      }
    } catch (error) {
      console.error('[Voices] ❌ Error loading default voices:', error);
      setVoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.voice-add-menu-wrapper')) {
        setShowAddMenu({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSavedVoices = async () => {
    try {
      // Load saved voices from localStorage or API
      const saved = localStorage.getItem(`savedVoices_${shop}`);
      if (saved) {
        setSavedVoices(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved voices:', error);
    }
  };

  const loadClonedVoices = async () => {
    try {
      // Load cloned voices - these are user-created voices
      const response = await api.getVoices('', shop);
      if (response && response.voices) {
        const cloned = response.voices.filter(v => v.isUserVoice && !v.isScalysisVoice);
        // Sort by createdAt descending (newest first) and add current date/time if missing
        const clonedWithDates = cloned.map(v => ({
          ...v,
          createdAt: v.createdAt || v.created_at || new Date().toISOString()
        })).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // Newest first
        });
        setClonedVoices(clonedWithDates);
        console.log('[Voices] Loaded cloned voices:', clonedWithDates.length);
      }
    } catch (error) {
      console.error('Error loading cloned voices:', error);
    }
  };

  const saveVoiceToMyVoices = (voice) => {
    try {
      const saved = [...savedVoices];
      if (!saved.find(v => v.id === voice.id)) {
        saved.push(voice);
        setSavedVoices(saved);
        localStorage.setItem(`savedVoices_${shop}`, JSON.stringify(saved));
        alert('Voice saved to My Voices!');
      } else {
        alert('Voice already in My Voices');
      }
      setShowAddMenu({});
    } catch (error) {
      console.error('Error saving voice:', error);
      alert('Failed to save voice');
    }
  };

  const loadAgents = async () => {
    try {
      const response = await fetch(`/api/scripts?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.scripts) {
        setAgents(data.scripts);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const searchVoices = async (query = null) => {
    try {
      setLoading(true);
      const queryToUse = query !== null ? query : searchQuery;
      console.log('[Voices] Searching voices with query:', queryToUse || '(empty)', 'shop:', shop || '(none)');
      const response = await api.getVoices(queryToUse || '', shop);
      console.log('[Voices] API response:', response);
      if (response && response.voices) {
        console.log('[Voices] Received', response.voices.length, 'voices');
        setVoices(response.voices);
      } else {
        console.log('[Voices] No voices in response:', response);
        setVoices([]);
      }
    } catch (error) {
      console.error('[Voices] Error fetching voices:', error);
      setVoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Map voice names to MP3 files for both English and Hinglish previews
  const getVoiceMp3Path = (voiceName, voiceId, language = 'english') => {
    if (!voiceName) return null;

    const normalizedName = voiceName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    const isHinglish = language === 'hinglish';

    // Map voice names to MP3 files (English and Hinglish)
    const voiceMp3Map = {
      // English mappings
      'amrita': isHinglish ? '/mp3 audios/amrtiahinglish.wav' : '/mp3 audios/amritaenglish.wav',
      'amrit': isHinglish ? '/mp3 audios/amrtiahinglish.wav' : '/mp3 audios/amritaenglish.wav',
      'arushimature': isHinglish ? '/mp3 audios/arushimature.wav' : '/mp3 audios/arushimatureenglish.wav',
      'arushi': isHinglish ? '/mp3 audios/arushimature.wav' : '/mp3 audios/arushimatureenglish.wav',
      'arushimatureenglish': '/mp3 audios/arushimatureenglish.wav',
      'fatima': isHinglish ? '/mp3 audios/fatimahinglish.wav' : '/mp3 audios/fatimaenglish.wav',
      'fatimaenglish': '/mp3 audios/fatimaenglish.wav',
      'maya': isHinglish ? '/mp3 audios/mayahinglish.wav' : '/mp3 audios/mayaenglish.wav',
      'mayaenglish': '/mp3 audios/mayaenglish.wav',
      'ritika': isHinglish ? '/mp3 audios/ritikahinglish.wav' : '/mp3 audios/ritikaenglish.wav',
      'ritikaenglish': '/mp3 audios/ritikaenglish.wav',
      'shreya': isHinglish ? '/mp3 audios/shreyaclearhinglish.wav' : '/mp3 audios/shreyaclear.wav',
      'shreyaclear': isHinglish ? '/mp3 audios/shreyaclearhinglish.wav' : '/mp3 audios/shreyaclear.wav',
      'shreyaupgraded': isHinglish ? '/mp3 audios/shreyaclearhinglish.wav' : '/mp3 audios/shreyaclear.wav',
      'shreyaupgraded20': isHinglish ? '/mp3 audios/shreyaclearhinglish.wav' : '/mp3 audios/shreyaclear.wav',
      'shreyaclearenglish': '/mp3 audios/shreyaclear.wav',
      // Hinglish specific mappings
      'amrtiahinglish': '/mp3 audios/amrtiahinglish.wav',
      'fatimahinglish': '/mp3 audios/fatimahinglish.wav',
      'mayahinglish': '/mp3 audios/mayahinglish.wav',
      'ritikahinglish': '/mp3 audios/ritikahinglish.wav',
      'shreyaclearhinglish': '/mp3 audios/shreyaclearhinglish.wav',
      // Sarvam voice mappings (use WAV files provided by user)
      'sarvam_anushka': '/mp3 audios/anushka.wav',
      'sarvam_abhilash': '/mp3 audios/abhilash.wav',
      'sarvam_manisha': '/mp3 audios/manisha.wav',
      'sarvam_vidya': '/mp3 audios/vidya.wav',
      'sarvam_arya': '/mp3 audios/arya.wav',
      'sarvam_karun': '/mp3 audios/karun.wav',
      'sarvam_hitesh': '/mp3 audios/hitesh.wav',
      'anushka': '/mp3 audios/anushka.wav',
      'abhilash': '/mp3 audios/abhilash.wav',
      'manisha': '/mp3 audios/manisha.wav',
      'vidya': '/mp3 audios/vidya.wav',
      'arya': '/mp3 audios/arya.wav',
      'karun': '/mp3 audios/karun.wav',
      'hitesh': '/mp3 audios/hitesh.wav',
      // Scalysis V1 voice mappings (fallback to Sarvam voices)
      'scalysis_v1_aarav': '/mp3 audios/abhilash.wav',
      'scalysis_v1_priya': '/mp3 audios/vidya.wav',
      'scalysis_v1_rohan': '/mp3 audios/karun.wav',
      'scalysis_v1_kavya': '/mp3 audios/arya.wav',
      'aarav': '/mp3 audios/abhilash.wav',
      'priya': '/mp3 audios/vidya.wav',
      'rohan': '/mp3 audios/karun.wav',
      'kavya': '/mp3 audios/arya.wav',
      // Additional premium voices
      'simran': '/mp3 audios/simran.mp3',
      'rachel': '/mp3 audios/rachel.mp3',
      'monika': '/mp3 audios/monika.mp3',
      'aarush': '/mp3 audios/aarush.mp3'
    };

    // Check direct match
    if (voiceMp3Map[normalizedName]) {
      return voiceMp3Map[normalizedName];
    }

    // Check partial matches
    for (const [key, path] of Object.entries(voiceMp3Map)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return path;
      }
    }

    return null;
  };

  const handlePreview = async (voiceId) => {
    try {
      // If the same voice is playing, pause it
      if (playingVoiceId === voiceId && playingAudio && !playingAudio.paused) {
        playingAudio.pause();
        setPreviewing(prev => ({ ...prev, [voiceId]: false }));
        setPlayingAudio(null);
        setPlayingVoiceId(null);
        return;
      }

      // If a different voice is playing, stop it first
      if (playingAudio && !playingAudio.paused) {
        playingAudio.pause();
        playingAudio.currentTime = 0;
        if (playingVoiceId) {
          setPreviewing(prev => ({ ...prev, [playingVoiceId]: false }));
        }
      }

      // Get the selected language for this voice (default to 'english')
      const selectedLanguage = voiceLanguages[voiceId] || 'english';

      // Use MP3 for both English and Hinglish if available
      // Find the voice object to get its name (include all voice types)
      const allVoices = [...voices, ...savedVoices, ...clonedVoices, ...getSarvamVoices(), ...getElevenLabsVoices(), ...getCartesiaVoices(), ...getScalysisV1Voices(), ...getRimeVoices(), ...getHumeVoices()];
      const voice = allVoices.find(v => v.id === voiceId);
      const voiceName = voice?.name || voiceId;
      const mp3Path = getVoiceMp3Path(voiceName, voiceId, selectedLanguage);

      if (mp3Path) {
        // Play MP3 file directly
        console.log(`🎵 [MP3 PLAYBACK] Playing pre-recorded MP3 for voice: ${voiceName} (${selectedLanguage})`, mp3Path);
        setPreviewing(prev => ({ ...prev, [voiceId]: true }));
        const audio = new Audio(mp3Path);

        audio.onended = () => {
          console.log(`✅ [MP3 PLAYBACK] Finished playing MP3 for: ${voiceName}`);
          setPreviewing(prev => ({ ...prev, [voiceId]: false }));
          setPlayingAudio(null);
          setPlayingVoiceId(null);
        };

        audio.onerror = (e) => {
          console.error('❌ [MP3 PLAYBACK] Error playing MP3:', e);
          setPreviewing(prev => ({ ...prev, [voiceId]: false }));
          setPlayingAudio(null);
          setPlayingVoiceId(null);
        };

        setPlayingAudio(audio);
        setPlayingVoiceId(voiceId);
        await audio.play();
      } else {
        alert(`No pre-generated audio file available for "${voiceName}". Voice generation is disabled. Please contact support to add this voice to audio library.`);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewing(prev => ({ ...prev, [voiceId]: false }));
      setPlayingAudio(null);
      setPlayingVoiceId(null);
      alert('Failed to play preview: ' + (error.message || 'Unknown error'));
    }
  };

  const handlePreviewWithAPI = async (voiceId) => {
    const allVoices = [...voices, ...savedVoices, ...clonedVoices, ...getSarvamVoices(), ...getElevenLabsVoices(), ...getCartesiaVoices(), ...getScalysisV1Voices(), ...getRimeVoices(), ...getHumeVoices()];
    const voice = allVoices.find(v => v.id === voiceId);
    const voiceName = voice?.name || voiceId;

    alert(`No pre-generated audio file available for "${voiceName}". Voice generation is disabled. Please contact support to add this voice to the audio library.`);
  };

  const handleCopyId = async (voiceId) => {
    try {
      await navigator.clipboard.writeText(voiceId);
      const btn = document.querySelector(`[data-voice-id="${voiceId}"]`);
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Copy error:', error);
      alert('Failed to copy ID');
    }
  };

  const handleUseVoice = (voice) => {
    setSelectedVoiceForAssignment(voice);
    setShowAssignModal(true);
    setShowAddMenu({});
  };

  const handleAddToMyVoices = (voice) => {
    saveVoiceToMyVoices(voice);
  };

  const toggleAddMenu = (voiceId) => {
    setShowAddMenu(prev => ({
      ...prev,
      [voiceId]: !prev[voiceId]
    }));
  };

  const handleVoiceClick = (voice) => {
    setSelectedVoiceForPreview(voice);
    setVoicePreviewText('');
  };

  const handleCloseVoicePreview = () => {
    setSelectedVoiceForPreview(null);
    setVoicePreviewText('');
    setIsPlayingVoice(false);
  };

  const handleSpeakVoice = async () => {
    if (!selectedVoiceForPreview || !voicePreviewText.trim() || isPlayingVoice) return;

    alert('Voice generation is disabled. Please use pre-generated audio files only.');
  };

  const handleAssignVoiceToAgent = async (agentId) => {
    if (!shop || !selectedVoiceForAssignment) return;
    
    try {
      const getResponse = await fetch(`/api/scripts?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const getData = await getResponse.json();
      const agent = (getData.scripts || []).find(a => a.id === agentId);
      
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      const response = await fetch(`/api/scripts/${agentId}?shop=${encodeURIComponent(shop)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agent.name,
          content: agent.content || agent.frontendDisplayScript || '',
          voiceId: selectedVoiceForAssignment.id,
          description: agent.description || '',
          successCriteria: agent.successCriteria || [],
          otherCriteria: agent.otherCriteria || []
        })
      });
      
      const data = await response.json();
      if (data.success || !data.error) {
        alert('Voice assigned successfully!');
        setShowAssignModal(false);
        setSelectedVoiceForAssignment(null);
        await loadAgents();
      } else {
        throw new Error(data.error || 'Failed to assign voice');
      }
    } catch (error) {
      console.error('Error assigning voice:', error);
      alert('Failed to assign voice: ' + error.message);
    }
  };

  // Extract voice metadata and tags from Cartesia data
  const getVoiceMetadata = (voice) => {
    const name = (voice.name || '').toLowerCase();
    const description = (voice.description || '').toLowerCase();
    
    // Gender detection
    let gender = 'neutral';
    if (name.includes('female') || name.includes('woman') || description.includes('female') || description.includes('woman') || description.includes('she')) {
      gender = 'female';
    } else if (name.includes('male') || name.includes('man') || description.includes('male') || description.includes('man') || description.includes('he')) {
      gender = 'male';
    }
    
    // Extract tags from description (Cartesia format)
    const tags = [];
    if (description.includes('conversational') || name.includes('conversational')) tags.push({ label: 'Conversational', color: '#3B82F6' });
    if (description.includes('emotive') || description.includes('emotional') || description.includes('expressive')) tags.push({ label: 'Emotive', color: '#F59E0B' });
    if (description.includes('advertising') || description.includes('commercial')) tags.push({ label: 'Advertising', color: '#10B981' });
    if (description.includes('entertainment') || description.includes('narrat')) tags.push({ label: 'Entertainment', color: '#EF4444' });
    if (description.includes('professional') || description.includes('business')) tags.push({ label: 'Professional', color: '#8B5CF6' });
    if (description.includes('warm') || description.includes('friendly')) tags.push({ label: 'Warm', color: '#EC4899' });
    if (description.includes('calm') || description.includes('soothing') || description.includes('meditation')) tags.push({ label: 'Calm', color: '#06B6D4' });
    
    // Language and accent
    const language = voice.language || 'English';
    let accent = 'Standard';
    if (description.includes('american') || name.includes('american')) accent = 'American';
    else if (description.includes('british') || name.includes('british')) accent = 'British';
    else if (description.includes('indian') || name.includes('indian') || language.toLowerCase().includes('hindi')) accent = 'Indian';
    
    return { gender, tags, language, accent };
  };

  const getFilteredVoices = () => {
    switch (activeTab) {
      case 'ultra-realistic':
        // Show ultra realistic voices from all sources (voices with isUltraRealistic flag)
        // These are public voices from rahul@scalysis.com account
        const allVoicesForUltra = [...voices, ...savedVoices, ...clonedVoices];
        const ultraVoices = allVoicesForUltra.filter(v => v.isUltraRealistic === true);
        console.log('[Voices] Ultra realistic tab: found', ultraVoices.length, 'voices');
        if (ultraVoices.length > 0) {
          console.log('[Voices] Ultra realistic voice names:', ultraVoices.map(v => v.name).join(', '));
        }
        return ultraVoices;
      case 'explore':
        return voices.filter(v => !v.isUserVoice || v.isScalysisVoice);
      case 'my-voices':
        return [...savedVoices, ...clonedVoices];
      case 'cloned-voices':
        return clonedVoices;
      case 'clone-voice':
        return clonedVoices;
      default:
        return voices;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleDownloadSource = async (voice) => {
    // Check if source file URL is available
    if (voice.sourceUrl) {
      window.open(voice.sourceUrl, '_blank');
      return;
    }
    
    // If source file is stored, try to fetch it
    if (voice.sourceFileId) {
      try {
        const response = await fetch(`/api/voices/${voice.id}/source?shop=${encodeURIComponent(shop || '')}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${voice.name || 'voice'}_source.${blob.type.includes('mp3') ? 'mp3' : blob.type.includes('wav') ? 'wav' : 'audio'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          alert('Source file not available for download');
        }
      } catch (error) {
        console.error('Error downloading source:', error);
        alert('Failed to download source file');
      }
    } else {
      alert('Source file not available for this voice');
    }
  };

  // Format voice name in premium style
  const formatPremiumVoiceName = (voice) => {
    const name = (voice.name || '').trim();
    if (!name) return 'Untitled Voice';
    
    // Extract premium name patterns
    // Example: "Female 28 Yr Old - Ultra Premium For High AOV Products" -> "HANA"
    // Try to extract meaningful name or create one from initials
    
    // Check if name already looks premium (short, capitalized)
    if (name.length <= 20 && /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(name)) {
      return name;
    }
    
    // Extract key words and create initials or short name
    const words = name.split(/\s+/);
    const keyWords = words.filter(w => 
      !['female', 'male', 'yr', 'old', 'year', 'for', 'high', 'aov', 'products', 'tier', 'city', 'premium', 'ultra', 'the', 'a', 'an'].includes(w.toLowerCase())
    );
    
    if (keyWords.length > 0) {
      // Create name from first meaningful words (max 2 words, capitalized)
      const premiumName = keyWords.slice(0, 2)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return premiumName.length <= 20 ? premiumName : premiumName.substring(0, 17) + '...';
    }
    
    // Fallback: use first word capitalized
    return words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() : name;
  };
  
  // Format voice description in premium style
  const formatPremiumVoiceDescription = (voice, metadata) => {
    const parts = [];
    
    // Add tone/style
    if (metadata.tags.length > 0) {
      parts.push(metadata.tags[0].label);
    }
    
    // Add age if available
    const name = (voice.name || '').toLowerCase();
    const ageMatch = name.match(/(\d+)\s*(yr|year|yo)/i);
    if (ageMatch) {
      parts.push(`${ageMatch[1]}yo`);
    }
    
    // Add tier/location
    if (name.includes('tier 1')) parts.push('Tier 1');
    else if (name.includes('tier 2')) parts.push('Tier 2');
    
    // Add language/accent
    if (metadata.accent !== 'Standard') {
      parts.push(metadata.accent);
    } else if (metadata.language) {
      parts.push(metadata.language);
    }
    
    return parts.length > 0 ? parts.join(' | ') : voice.description || '';
  };

  // Helper to get language icon based on language
  const getLanguageIcon = (lang) => {
    const langLower = (lang || '').toLowerCase();
    // Use global icon for all languages (can be customized per language if needed)
    return '/images/Raycons Icons Pack (Community)/global-8532041.svg';
  };

  // Get colored SVG icon for a voice from /images/voice/ directory
  const getVoiceColorIcon = (voice) => {
    // Available color SVG files
    const colorIcons = [
      '/images/voice/blue.svg',
      '/images/voice/green.svg',
      '/images/voice/green2.svg',
      '/images/voice/green3.svg',
      '/images/voice/orange.svg',
      '/images/voice/pink.svg',
      '/images/voice/pink2.svg',
      '/images/voice/purple.svg',
      '/images/voice/purple2.svg',
      '/images/voice/red.svg',
      '/images/voice/silver.svg',
      '/images/voice/yellow.svg'
    ];
    
    // Create a unique identifier from voice ID and name
    const uniqueKey = `${voice.id}-${(voice.name || '').toLowerCase()}`;
    
    // Use hash function to consistently assign a color to each voice
    const hash = hashString(uniqueKey);
    const index = hash % colorIcons.length;
    
    return colorIcons[index];
  };

  // Render small voice card for horizontal scrolling sections
  const renderVoiceCard = (voice, isCompact = false) => {
    const metadata = getVoiceMetadata(voice);
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const colorIcon = getVoiceColorIcon(voice);
    
    return (
      <div 
        key={voice.id}
        className="voice-card-small"
      >
        <div 
          className="voice-card-avatar"
          style={{
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}
        >
          <img 
            src={colorIcon} 
            alt="Voice icon" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to gradient if icon fails to load
              const gradientColors = getVoiceGradient(voice.id, voice.name);
              e.target.style.display = 'none';
              e.currentTarget.parentElement.style.background = `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`;
            }}
          />
        </div>
        <div className="voice-card-content">
          <div className="voice-card-name">{voiceCustomizations[voice.id]?.name || premiumName}</div>
          {!isCompact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              {/* Pricing Tag */}
              {(() => {
                const pricing = getVoicePricing(voice);
                return pricing ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#6B7280',
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    {pricing.label}
                  </span>
                ) : null;
              })()}
              {/* Cache/Live Generation Tag */}
              {(() => {
                const selectedLanguage = voiceLanguages[voice.id] || 'english';
                const isCached = isVoiceCached(voice.name, voice.id, selectedLanguage);
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: isCached ? '#059669' : '#DC2626',
                      background: isCached ? '#D1FAE5' : '#FEE2E2',
                      border: `1px solid ${isCached ? '#A7F3D0' : '#FECACA'}`
                    }}
                  >
                    {isCached ? 'Cache' : 'Live'}
                  </span>
                );
              })()}
              {metadata.language && (
                <div className="voice-card-meta">
                  <img src={getLanguageIcon(metadata.language)} alt={metadata.language} width="14" height="14" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {metadata.language}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="voice-card-play"
          onClick={(e) => {
            e.stopPropagation();
            handlePreview(voice.id);
          }}
        >
          {isCurrentlyPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          )}
        </button>
      </div>
    );
  };

  // Render premium voice card (new design)
  const renderPremiumVoiceCard = (voice) => {
    const metadata = getVoiceMetadata(voice);
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const colorIcon = getVoiceColorIcon(voice);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card"
      >
        {/* Left Section - Image */}
        <div className="premium-voice-card-image">
          <img 
            src={colorIcon} 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover'
            }}
            onError={(e) => {
              const gradientColors = getVoiceGradient(voice.id, voice.name);
              e.target.style.display = 'none';
              e.currentTarget.parentElement.style.background = `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`;
            }}
          />
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            <img 
              src="/images/verified-digital-emblem-with-a-translucent-aesthetic-imparting-trust-and-confirmation-on-the-png.png" 
              alt="Verified" 
              className="premium-voice-verified-icon"
              title="High Quality"
            />
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {/* Pricing Tag */}
            {(() => {
              const pricing = getVoicePricing(voice);
              return pricing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6B7280',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {pricing.label}
                </span>
              ) : null;
            })()}
            {/* Cache/Live Generation Tag */}
            {(() => {
              const selectedLanguage = voiceLanguages[voice.id] || 'english';
              const isCached = isVoiceCached(voice.name, voice.id, selectedLanguage);
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isCached ? '#059669' : '#DC2626',
                    background: isCached ? '#D1FAE5' : '#FEE2E2',
                    border: `1px solid ${isCached ? '#A7F3D0' : '#FECACA'}`
                  }}
                >
                  {isCached ? 'Cache' : 'Live Generation'}
                </span>
              );
            })()}
          </div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Get Sarvam image path for a voice
  const getSarvamImagePath = (voiceName) => {
    const sarvamImages = [
      '/images/sarvam/image 2.svg',
      '/images/sarvam/image 3.svg',
      '/images/sarvam/image 4.svg',
      '/images/sarvam/image 5.svg',
      '/images/sarvam/image 6.svg',
      '/images/sarvam/image 7.svg'
    ];
    const name = (voiceName || '').toLowerCase();
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sarvamImages[hash % sarvamImages.length];
  };

  // Render Sarvam premium voice card (similar to premium but with Sarvam-specific styling)
  const renderSarvamPremiumVoiceCard = (voice) => {
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const sarvamImage = getSarvamImagePath(voice.name);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    // Get initial letter for overlay
    const initial = (voice.name || 'A').charAt(0).toUpperCase();
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card sarvam-premium-voice-card"
      >
        {/* Left Section - Image with Initial Overlay */}
        <div className="premium-voice-card-image sarvam-voice-card-image">
          <img 
            src={sarvamImage} 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover'
            }}
          />
          <div className="sarvam-voice-initial-overlay">
            {initial}
          </div>
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            {/* No verified tick for Sarvam */}
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Get CSS filter style for ElevenLabs orb image based on voice
  const getElevenLabsImageFilter = (voice) => {
    const name = (voice.name || '').toLowerCase();
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Create different filter combinations using hue-rotate, saturate, and rotate
    const filters = [
      { hueRotate: '0deg', saturate: '100%', rotate: '0deg' },
      { hueRotate: '60deg', saturate: '120%', rotate: '15deg' },
      { hueRotate: '120deg', saturate: '110%', rotate: '-15deg' },
      { hueRotate: '180deg', saturate: '130%', rotate: '30deg' },
      { hueRotate: '240deg', saturate: '100%', rotate: '-30deg' },
      { hueRotate: '300deg', saturate: '115%', rotate: '45deg' },
      { hueRotate: '45deg', saturate: '125%', rotate: '-45deg' },
      { hueRotate: '90deg', saturate: '105%', rotate: '20deg' }
    ];
    
    const filter = filters[hash % filters.length];
    return {
      filter: `hue-rotate(${filter.hueRotate}) saturate(${filter.saturate})`,
      transform: `rotate(${filter.rotate})`
    };
  };

  // Get CSS filter style for Cartesia icon (filters but no rotation)
  const getCartesiaImageFilter = (voice) => {
    const name = (voice.name || '').toLowerCase();
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const filters = [
      { hueRotate: '0deg', saturate: '100%' },
      { hueRotate: '60deg', saturate: '120%' },
      { hueRotate: '120deg', saturate: '110%' },
      { hueRotate: '180deg', saturate: '130%' },
      { hueRotate: '240deg', saturate: '100%' },
      { hueRotate: '300deg', saturate: '115%' },
      { hueRotate: '45deg', saturate: '125%' },
      { hueRotate: '90deg', saturate: '105%' }
    ];
    
    const filter = filters[hash % filters.length];
    return {
      filter: `hue-rotate(${filter.hueRotate}) saturate(${filter.saturate})`
    };
  };

  // Get CSS filter style for Rime image (filters but no rotation)
  const getRimeImageFilter = (voice) => {
    const name = (voice.name || '').toLowerCase();
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const filters = [
      { hueRotate: '0deg', saturate: '100%', brightness: '100%' },
      { hueRotate: '30deg', saturate: '110%', brightness: '105%' },
      { hueRotate: '60deg', saturate: '120%', brightness: '100%' },
      { hueRotate: '90deg', saturate: '115%', brightness: '110%' },
      { hueRotate: '120deg', saturate: '100%', brightness: '105%' },
      { hueRotate: '150deg', saturate: '125%', brightness: '100%' }
    ];
    
    const filter = filters[hash % filters.length];
    return {
      filter: `hue-rotate(${filter.hueRotate}) saturate(${filter.saturate}) brightness(${filter.brightness})`
    };
  };

  // Get CSS transform for Hume image (rotate but no filters)
  const getHumeImageTransform = (voice) => {
    const name = (voice.name || '').toLowerCase();
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const rotations = ['0deg', '15deg', '-15deg', '30deg', '-30deg', '45deg', '-45deg', '60deg'];
    const rotate = rotations[hash % rotations.length];
    
    return {
      transform: `rotate(${rotate})`
    };
  };

  // Render ElevenLabs premium voice card
  const renderElevenLabsPremiumVoiceCard = (voice) => {
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const imageFilter = getElevenLabsImageFilter(voice);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card elevenlabs-premium-voice-card"
      >
        {/* Left Section - Image with CSS Filters */}
        <div className="premium-voice-card-image elevenlabs-voice-card-image">
          <img 
            src="/images/orb-2.webp" 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover',
              ...imageFilter
            }}
          />
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            <img 
              src="/images/verified-digital-emblem-with-a-translucent-aesthetic-imparting-trust-and-confirmation-on-the-png.png" 
              alt="Verified" 
              className="premium-voice-verified-icon"
            />
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {/* Pricing Tag */}
            {(() => {
              const pricing = getVoicePricing(voice);
              return pricing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6B7280',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {pricing.label}
                </span>
              ) : null;
            })()}
            {/* Cache/Live Generation Tag */}
            {(() => {
              const selectedLanguage = voiceLanguages[voice.id] || 'english';
              const isCached = isVoiceCached(voice.name, voice.id, selectedLanguage);
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isCached ? '#059669' : '#DC2626',
                    background: isCached ? '#D1FAE5' : '#FEE2E2',
                    border: `1px solid ${isCached ? '#A7F3D0' : '#FECACA'}`
                  }}
                >
                  {isCached ? 'Cache' : 'Live Generation'}
                </span>
              );
            })()}
          </div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Cartesia premium voice card
  const renderCartesiaPremiumVoiceCard = (voice) => {
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const imageFilter = getCartesiaImageFilter(voice);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card cartesia-premium-voice-card"
      >
        {/* Left Section - Image with CSS Filters (no rotation) */}
        <div className="premium-voice-card-image cartesia-voice-card-image">
          <img 
            src="/images/cartesiaicon.svg" 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover',
              ...imageFilter
            }}
          />
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            {/* No verified tick for Cartesia */}
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {/* Pricing Tag */}
            {(() => {
              const pricing = getVoicePricing(voice);
              return pricing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6B7280',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {pricing.label}
                </span>
              ) : null;
            })()}
            {/* Cache/Live Generation Tag */}
            {(() => {
              const selectedLanguage = voiceLanguages[voice.id] || 'english';
              const isCached = isVoiceCached(voice.name, voice.id, selectedLanguage);
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isCached ? '#059669' : '#DC2626',
                    background: isCached ? '#D1FAE5' : '#FEE2E2',
                    border: `1px solid ${isCached ? '#A7F3D0' : '#FECACA'}`
                  }}
                >
                  {isCached ? 'Cache' : 'Live Generation'}
                </span>
              );
            })()}
          </div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Scalysis V1 premium voice card
  const renderScalysisV1PremiumVoiceCard = (voice) => {
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const colorIcon = getVoiceColorIcon(voice);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card scalysis-v1-premium-voice-card"
      >
        {/* Left Section - Image (similar to Scalysis V3) */}
        <div className="premium-voice-card-image">
          <img 
            src={colorIcon} 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover'
            }}
            onError={(e) => {
              const gradientColors = getVoiceGradient(voice.id, voice.name);
              e.target.style.display = 'none';
              e.currentTarget.parentElement.style.background = `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`;
            }}
          />
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            {/* No verified tick for Scalysis V1 */}
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {/* Pricing Tag */}
            {(() => {
              const pricing = getVoicePricing(voice);
              return pricing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6B7280',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {pricing.label}
                </span>
              ) : null;
            })()}
            {/* Cache/Live Generation Tag */}
            {(() => {
              const selectedLanguage = voiceLanguages[voice.id] || 'english';
              const isCached = isVoiceCached(voice.name, voice.id, selectedLanguage);
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isCached ? '#059669' : '#DC2626',
                    background: isCached ? '#D1FAE5' : '#FEE2E2',
                    border: `1px solid ${isCached ? '#A7F3D0' : '#FECACA'}`
                  }}
                >
                  {isCached ? 'Cache' : 'Live Generation'}
                </span>
              );
            })()}
          </div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Rime premium voice card
  const renderRimePremiumVoiceCard = (voice) => {
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const imageFilter = getRimeImageFilter(voice);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card rime-premium-voice-card"
      >
        {/* Left Section - Image with CSS Filters (no rotation) */}
        <div className="premium-voice-card-image rime-voice-card-image">
          <img 
            src="/images/rime.jpeg" 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover',
              ...imageFilter
            }}
          />
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            {/* No verified tick for Rime */}
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {/* Pricing Tag */}
            {(() => {
              const pricing = getVoicePricing(voice);
              return pricing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6B7280',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {pricing.label}
                </span>
              ) : null;
            })()}
            {/* Cache/Live Generation Tag */}
            {(() => {
              const selectedLanguage = voiceLanguages[voice.id] || 'english';
              const isCached = isVoiceCached(voice.name, voice.id, selectedLanguage);
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isCached ? '#059669' : '#DC2626',
                    background: isCached ? '#D1FAE5' : '#FEE2E2',
                    border: `1px solid ${isCached ? '#A7F3D0' : '#FECACA'}`
                  }}
                >
                  {isCached ? 'Cache' : 'Live Generation'}
                </span>
              );
            })()}
          </div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Hume premium voice card
  const renderHumePremiumVoiceCard = (voice) => {
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const imageTransform = getHumeImageTransform(voice);
    const languageText = getLanguageDisplayText(voice);
    const descriptionText = getVoiceDescriptionTags(voice);
    const languageIcons = getLanguageIconsWithColors(voice);
    
    return (
      <div 
        key={voice.id}
        className="premium-voice-card hume-premium-voice-card"
      >
        {/* Left Section - Image with Rotation (no filters) */}
        <div className="premium-voice-card-image hume-voice-card-image">
          <img 
            src="/images/hume-ai9391.logowik.com.webp" 
            alt="Voice icon" 
            style={{ 
              height: '60%', 
              objectFit: 'cover',
              ...imageTransform
            }}
          />
        </div>
        
        {/* Middle Section - Content */}
        <div className="premium-voice-card-content">
          <div className="premium-voice-card-name">
            {voiceCustomizations[voice.id]?.name || premiumName}
            {/* No verified tick for Hume */}
          </div>
          <div className="premium-voice-card-description">{descriptionText}</div>
          <div className="premium-voice-card-language">
            <div className="premium-voice-language-icons">
              {languageIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="premium-voice-language-icon"
                  style={{
                    backgroundColor: '#E3F2FD',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: languageIcons.length - idx
                  }}
                >
                  {icon.char}
                </div>
              ))}
            </div>
            <span className="premium-voice-language-text">{languageText}</span>
          </div>
        </div>
        
        {/* Rightmost Section - Play/Pause (visible on hover) */}
        <div className="premium-voice-card-controls">
          <button
            className="premium-voice-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(voice.id);
            }}
          >
            {isCurrentlyPlaying ? (
              <img src="/images/poly.svg" alt="Pause" width="13" height="17" />
            ) : (
              <img src="/images/Polygon 2.svg" alt="Play" width="17" height="18" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render use case card (larger format)
  const renderUseCaseCard = (voice) => {
    const metadata = getVoiceMetadata(voice);
    const premiumName = formatPremiumVoiceName(voice);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const colorIcon = getVoiceColorIcon(voice);
    
    return (
      <div 
        key={voice.id}
        className="voice-use-case-card"
      >
        <div className="voice-use-case-header">
          <div 
            className="voice-use-case-avatar"
            style={{
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #E5E7EB',
              overflow: 'hidden'
            }}
          >
            <img 
              src={colorIcon} 
              alt="Voice icon" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
              onError={(e) => {
                // Fallback to gradient if icon fails to load
                const gradientColors = getVoiceGradient(voice.id, voice.name);
                e.target.style.display = 'none';
                e.currentTarget.parentElement.style.background = `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`;
              }}
            />
          </div>
          <div className="voice-use-case-name">{voiceCustomizations[voice.id]?.name || premiumName}</div>
        </div>
        <button
          className="voice-use-case-play"
          onClick={(e) => {
            e.stopPropagation();
            handlePreview(voice.id);
          }}
        >
          {isCurrentlyPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          )}
        </button>
      </div>
    );
  };

  const renderVoiceRow = (voice) => {
    const metadata = getVoiceMetadata(voice);
    const isPreviewing = previewing[voice.id];
    const isAddMenuOpen = showAddMenu[voice.id];
    const isClonedVoice = activeTab === 'cloned-voices' || activeTab === 'clone-voice';
    const isUltraRealistic = voice.isUltraRealistic === true;
    const premiumName = formatPremiumVoiceName(voice);
    const premiumDescription = formatPremiumVoiceDescription(voice, metadata);
    const isCurrentlyPlaying = playingVoiceId === voice.id && playingAudio && !playingAudio.paused;
    const colorIcon = getVoiceColorIcon(voice);

  return (
      <div 
        key={voice.id} 
        className="voice-row"
      >
        <div className="voice-row-play" onClick={(e) => {
          e.stopPropagation();
          handlePreview(voice.id);
        }}>
          {isCurrentlyPlaying ? (
            <div className="voice-play-button playing">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
              </svg>
            </div>
          ) : (
            <div className="voice-play-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
          </div>
                )}
              </div>
        
        {/* Colored Icon */}
        <div 
          className="voice-gradient-logo"
          style={{
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E5E7EB',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden'
          }}
        >
          <img 
            src={colorIcon} 
            alt="Voice icon" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to gradient if icon fails to load
              const gradientColors = getVoiceGradient(voice.id, voice.name);
              e.target.style.display = 'none';
              e.currentTarget.parentElement.style.background = `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`;
              e.currentTarget.parentElement.style.border = 'none';
            }}
          />
        </div>
        
        <div className="voice-row-content">
          <div className="voice-row-name-wrapper">
            <div className="voice-row-name">
              {voiceCustomizations[voice.id]?.name || premiumName}
            </div>
            <button
              className="voice-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setEditingVoice(voice.id);
                setEditedVoiceName(voiceCustomizations[voice.id]?.name || voice.name || '');
                setEditedVoiceDescription(voiceCustomizations[voice.id]?.description || voice.description || '');
              }}
              title="Edit name and description"
            >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
          </button>
        </div>
          {(voiceCustomizations[voice.id]?.description || voice.description) && (
            <div className="voice-row-description-wrapper">
              <div className="voice-row-description">
                {voiceCustomizations[voice.id]?.description || voice.description}
      </div>
                    </div>
          )}
          <div className="voice-row-meta">
            <span className="voice-row-language">
              <img src={getLanguageIcon(metadata.language)} alt={metadata.language} width="14" height="14" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {metadata.language}
              {metadata.accent !== 'Standard' && ` ${metadata.accent}`}
            </span>
                {metadata.gender !== 'neutral' && (
              <span className="voice-row-gender">
                <img 
                  src={metadata.gender === 'female' 
                    ? '/images/Raycons Icons Pack (Community)/profile-user-8535330.svg' 
                    : '/images/Raycons Icons Pack (Community)/user-8535320.svg'} 
                  alt={metadata.gender} 
                  width="14" 
                  height="14" 
                  style={{ marginRight: '2px', verticalAlign: 'middle' }} 
                />
                        </span>
                      )}
            {metadata.tags.length > 0 && (
              <div className="voice-row-tags">
                {metadata.tags.map((tag, idx) => (
                  <span key={idx} className="voice-tag" style={{ background: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}>
                    {tag.label}
                  </span>
                ))}
                    </div>
            )}
            {isUltraRealistic && (
              <div className="voice-row-tags">
                <span className="voice-tag" style={{ 
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)', 
                  color: '#7c3aed', 
                  borderColor: 'rgba(139, 92, 246, 0.25)' 
                }}>
                  Flagship voice
                </span>
                <span 
                  className="voice-tag" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(34, 197, 94, 0.12) 100%)', 
                    color: '#3b82f6', 
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    cursor: 'help'
                  }}
                  title="uhh umm"
                >
                  Natural Pauses
                </span>
                <span 
                  className="voice-tag" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)', 
                    color: '#d97706', 
                    borderColor: 'rgba(251, 191, 36, 0.25)',
                    cursor: 'pointer'
                  }}
                  title="use [laughter]"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Use [laughter] in your script to add laughter to the voice');
                  }}
                >
                  Laugh Supported
                </span>
                  </div>
            )}
          </div>
        </div>
        
        {/* Language Selector */}
        <div className="voice-language-selector" onClick={(e) => e.stopPropagation()}>
                    <button
            className={`voice-lang-btn ${(voiceLanguages[voice.id] || 'english') === 'english' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setVoiceLanguages(prev => ({ ...prev, [voice.id]: 'english' }));
            }}
            title="English"
          >
            EN
                    </button>
                      <button
            className={`voice-lang-btn ${voiceLanguages[voice.id] === 'hinglish' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setVoiceLanguages(prev => ({ ...prev, [voice.id]: 'hinglish' }));
            }}
            title="Hinglish"
          >
            HI
          </button>
        </div>
        
        <div className="voice-row-actions" onClick={(e) => e.stopPropagation()}>
          {activeTab === 'explore' && (
            <div className="voice-add-menu-wrapper">
          <button
                className="voice-row-add-btn"
                onClick={() => toggleAddMenu(voice.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {isAddMenuOpen && (
                <div className="voice-add-menu">
                  {shop && (
                    <button
                      className="voice-add-menu-item"
                        onClick={() => handleUseVoice(voice)}
                      >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                </svg>
                      Add to Agent/Script
                      </button>
                    )}
                    <button
                    className="voice-add-menu-item"
                    onClick={() => handleAddToMyVoices(voice)}
                    >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21ZM10 7H8V9H10V7ZM10 11H8V13H10V11ZM10 15H8V17H10V15ZM16 7H12V9H16V7ZM16 11H12V13H16V11ZM16 15H12V17H16V15Z" fill="currentColor"/>
                </svg>
                    Add to My Voices
                    </button>
          </div>
                      )}
                    </div>
          )}
          {isClonedVoice && (
            <>
              <div className="voice-add-menu-wrapper">
                    <button
                  className="voice-row-add-btn"
                  onClick={() => toggleAddMenu(voice.id)}
                    >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                    </button>
                {isAddMenuOpen && (
                  <div className="voice-add-menu">
                    {shop && (
                      <button
                        className="voice-add-menu-item"
                        onClick={() => handleUseVoice(voice)}
                      >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
              </svg>
                        Add to Agent/Script
                      </button>
                    )}
                    <button
                      className="voice-add-menu-item"
                      onClick={() => handleAddToMyVoices(voice)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21ZM10 7H8V9H10V7ZM10 11H8V13H10V11ZM10 15H8V17H10V15ZM16 7H12V9H16V7ZM16 11H12V13H16V11ZM16 15H12V17H16V15Z" fill="currentColor"/>
                      </svg>
                      Add to My Voices
                    </button>
                    <button
                      className="voice-add-menu-item"
                      onClick={() => handleCopyId(voice.id)}
                    >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 3H5C3.89543 3 3 3.89543 3 5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H8C6.89543 21 6 20.1046 6 19V9C6 7.89543 6.89543 7 8 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
                      Copy Voice ID
                    </button>
                  </div>
                )}
                </div>
              <button
                className="voice-row-download-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadSource(voice);
                }}
                title="Download Source"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Download Source</span>
            </button>
            </>
          )}
          <button
            className="voice-row-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyId(voice.id);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>
            </div>
          </div>
    );
  };

  // Get language display text (e.g., "Hindi + 1")
  const getLanguageDisplayText = (voice) => {
    let languages = voice.languages || [];
    // Fallback to voice.language if languages array is empty
    if (languages.length === 0 && voice.language) {
      languages = [voice.language];
    }
    if (languages.length === 0) return 'English';
    if (languages.length === 1) {
      const lang = languages[0];
      // Capitalize first letter
      return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
    }
    const primary = languages[0];
    const more = languages.length - 1;
    const primaryFormatted = primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase();
    return `${primaryFormatted} + ${more}`;
  };

  // Get language character for display
  const getLanguageCharacter = (languageName) => {
    const langLower = (languageName || '').toLowerCase().trim();
    const languageMap = {
      'hindi': 'अ',
      'english': 'A',
      'telugu': 'అ',
      'tamil': 'அ',
      'kannada': 'ಅ',
      'malayalam': 'അ',
      'bengali': 'অ',
      'gujarati': 'અ',
      'marathi': 'अ',
      'punjabi': 'ਅ',
      'hinglish': 'अ',
      'oriya': 'ଅ',
      'assamese': 'অ',
      'nepali': 'अ',
      'urdu': 'ا',
      'sanskrit': 'अ'
    };
    
    if (languageMap[langLower]) {
      return languageMap[langLower];
    }
    
    for (const [key, char] of Object.entries(languageMap)) {
      if (langLower.includes(key) || key.includes(langLower)) {
        return char;
      }
    }
    
    if (langLower.includes('hindi')) return 'अ';
    if (langLower.includes('telugu')) return 'అ';
    if (langLower.includes('tamil')) return 'அ';
    if (langLower.includes('kannada')) return 'ಅ';
    if (langLower.includes('malayalam')) return 'അ';
    if (langLower.includes('bengali')) return 'অ';
    if (langLower.includes('gujarati')) return 'અ';
    if (langLower.includes('marathi')) return 'अ';
    if (langLower.includes('punjabi')) return 'ਅ';
    if (langLower.includes('oriya')) return 'ଅ';
    if (langLower.includes('assamese')) return 'অ';
    if (langLower.includes('nepali')) return 'अ';
    if (langLower.includes('urdu')) return 'ا';
    if (langLower.includes('sanskrit')) return 'अ';
    
    if (langLower.includes('english')) {
      return 'A';
    }
    
    return (langLower.charAt(0) || 'A').toUpperCase();
  };

  // Get language icons with colors for display (like playground)
  const getLanguageIconsWithColors = (voice) => {
    let languages = voice.languages || [];
    if (languages.length === 0 && voice.language) {
      languages = [voice.language];
    }
    
    const isOnlyEnglish = languages.length === 1 && 
      (languages[0].toLowerCase().includes('english') || 
       languages[0].toLowerCase() === 'en');
    
    if (isOnlyEnglish) {
      const lang = languages[0];
      const char = getLanguageCharacter(lang);
      const iconColors = ['#97C9FF', '#D0FF97', '#FFB397', '#FF97D0', '#D097FF'];
      const hash = (voice.id + lang).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const color = iconColors[hash % iconColors.length];
      return [{ char, color, lang }];
    }
    
    const primaryLang = languages[0];
    const languagesToShow = [primaryLang, 'English'];
    
    const icons = languagesToShow.map((lang, idx) => {
      const char = getLanguageCharacter(lang);
      const iconColors = ['#97C9FF', '#D0FF97', '#FFB397', '#FF97D0', '#D097FF'];
      const hash = (voice.id + lang).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const color = iconColors[hash % iconColors.length];
      
      return { char, color, lang };
    });
    
    return icons;
  };

  // Get voice description tags (random/different for each voice - some single, some multiple)
  const getVoiceDescriptionTags = (voice) => {
    // Single descriptions
    const singleDescriptions = [
      'friendly', 'conversational', 'engaging', 'salesly', 'professional',
      'warm', 'clear', 'confident', 'calm', 'energetic', 'authoritative',
      'gentle', 'strong', 'smooth', 'crisp', 'natural', 'expressive'
    ];
    
    // Multiple descriptions (combinations)
    const multipleDescriptions = [
      'salesly & friendly', 'conversational & warm', 'engaging & clear',
      'professional & confident', 'salesly & professional', 'friendly & conversational',
      'engaging & energetic', 'warm & friendly', 'clear & confident',
      'salesly & engaging', 'friendly & professional', 'conversational & engaging',
      'warm & professional', 'engaging & salesly', 'friendly & clear',
      'professional & warm', 'salesly & clear', 'conversational & confident'
    ];
    
    // Use voice ID to consistently assign description
    const hash = voice.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 60% chance for multiple descriptions, 40% for single
    const useMultiple = (hash % 10) < 6;
    
    if (useMultiple) {
      return multipleDescriptions[hash % multipleDescriptions.length];
    } else {
      return singleDescriptions[hash % singleDescriptions.length];
    }
  };

  // Get voices for different sections
  const getHighlightVoices = () => {
    const allVoices = [...voices, ...savedVoices, ...clonedVoices];
    return allVoices.filter(v => v.isUltraRealistic === true).slice(0, 10);
  };

  // Get Scalysis V3 voices - specific 6 voices that are global for all accounts
  const getScalysisV3Voices = () => {
    const allVoices = [...voices, ...savedVoices, ...clonedVoices];
    
    // Define the voice search patterns and their display names
    const scalysisV3VoiceConfig = [
      { searchPatterns: ['shreya upgraded', 'shreya upgraded 2.0'], displayName: 'Shreya' },
      { searchPatterns: ['maya'], displayName: 'Maya' },
      { searchPatterns: ['fatima'], displayName: 'Fatima' },
      { searchPatterns: ['amrita', 'amrit'], displayName: 'Amrita' },
      { searchPatterns: ['ritika'], displayName: 'Ritika' },
      { searchPatterns: ['arushi mature', 'arushi'], displayName: 'Arushi Mature' }
    ];
    
    const foundVoices = [];
    const foundIds = new Set();
    
    // Search for each voice by name pattern
    scalysisV3VoiceConfig.forEach(config => {
      const voice = allVoices.find(v => {
        if (foundIds.has(v.id)) return false; // Skip if already found
        const voiceName = (v.name || '').toLowerCase();
        const originalName = (v.originalName || v.name || '').toLowerCase();
        return config.searchPatterns.some(pattern => 
          voiceName.includes(pattern.toLowerCase()) || 
          originalName.includes(pattern.toLowerCase())
        );
      });
      
      if (voice) {
        foundIds.add(voice.id);
        // Create a copy with the correct display name
        foundVoices.push({
          ...voice,
          name: config.displayName,
          isScalysisV3: true,
          isGlobal: true,
          isUltraRealistic: true // Mark as ultra realistic for consistency
        });
      }
    });
    
    // If voices are not found in the loaded voices, create placeholder voices
    // These will be available globally for all accounts
    if (foundVoices.length < 6) {
      const missingVoices = scalysisV3VoiceConfig
        .filter(config => !foundVoices.find(v => v.name === config.displayName))
        .map(config => ({
          id: `scalysis_v3_${config.displayName.toLowerCase().replace(/\s+/g, '_')}`,
          name: config.displayName,
          originalName: config.searchPatterns[0],
          description: `Scalysis V3 ${config.displayName} voice - optimized for high volume calls`,
          language: 'Hindi',
          source: 'scalysis',
          provider: 'scalysis',
          isScalysisV3: true,
          isGlobal: true,
          isUltraRealistic: true,
          isScalysisVoice: true
        }));
      
      foundVoices.push(...missingVoices);
    }
    
    // Return in the specified order
    const orderedVoices = [];
    scalysisV3VoiceConfig.forEach(config => {
      const voice = foundVoices.find(v => v.name === config.displayName);
      if (voice) {
        orderedVoices.push(voice);
      }
    });
    
    return orderedVoices;
  };

  const getUseCaseVoices = () => {
    return voices.filter(v => !v.isUserVoice || v.isScalysisVoice).slice(0, 6);
  };

  const getPopularVoices = () => {
    const allVoices = [...voices, ...savedVoices, ...clonedVoices];
    return allVoices.slice(0, 12);
  };

  // Get Sarvam voices - these are hardcoded since API doesn't support fetching them
  // Voice pricing configuration (source of truth)
  const VOICE_PRICING = {
    'scalysis_v1': { price: 5, label: '5rs/minute', provider: 'Scalysis V1 (Inworld)' },
    'scalysis_v3': { price: 5, label: '5rs/minute', provider: 'Scalysis V3 (Ultra Realistic)' },
    'scalysis': { price: 5, label: '5rs/minute', provider: 'Scalysis' },
    'sarvam': { price: 3.8, label: '3.8rs/minute', provider: 'Sarvam' },
    'cartesia': { price: 7, label: '7rs/minute', provider: 'Cartesia' },
    'elevenlabs': { price: 13, label: '13rs/minute', provider: 'Eleven Labs' },
    'rime': { price: 10, label: '10rs/minute', provider: 'Rime' },
    'hume': { price: 8, label: '8rs/minute', provider: 'Hume' }
  };

  // Get voice pricing info
  const getVoicePricing = (voice) => {
    if (voice.isSarvamVoice || voice.source === 'sarvam' || voice.provider === 'sarvam' || voice.id?.startsWith('sarvam_')) {
      return VOICE_PRICING.sarvam;
    }
    if (voice.isElevenLabsVoice || voice.source === 'elevenlabs' || voice.provider === 'elevenlabs' || voice.id?.startsWith('elevenlabs_')) {
      return VOICE_PRICING.elevenlabs;
    }
    if (voice.isRimeVoice || voice.source === 'rime' || voice.provider === 'rime' || voice.id?.startsWith('rime_')) {
      return VOICE_PRICING.rime;
    }
    if (voice.isHumeVoice || voice.source === 'hume' || voice.provider === 'hume' || voice.id?.startsWith('hume_')) {
      return VOICE_PRICING.hume;
    }
    if (voice.isScalysisV1Voice || voice.id?.startsWith('scalysis_v1_')) {
      return VOICE_PRICING.scalysis_v1;
    }
    if (voice.isUltraRealistic || (voice.isScalysisVoice && voice.isUltraRealistic)) {
      return VOICE_PRICING.scalysis_v3;
    }
    if (voice.isScalysisVoice) {
      return VOICE_PRICING.scalysis;
    }
    // Cartesia voices (not Scalysis, not Sarvam, not ElevenLabs, etc.)
    if (!voice.isUserVoice && !voice.isScalysisVoice && !voice.isDefaultIndian) {
      return VOICE_PRICING.cartesia;
    }
    // Default to Scalysis
    return VOICE_PRICING.scalysis;
  };

  // Check if voice has cached MP3
  const isVoiceCached = (voiceName, voiceId, language = 'english') => {
    const mp3Path = getVoiceMp3Path(voiceName, voiceId, language);
    return !!mp3Path;
  };

  const getSarvamVoices = () => {
    const sarvamVoiceNames = ['anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh'];
    return sarvamVoiceNames.map(name => ({
      id: `sarvam_${name}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: `Sarvam ${name.charAt(0).toUpperCase() + name.slice(1)} voice for Indian languages`,
      language: 'Hindi',
      source: 'sarvam',
      provider: 'sarvam',
      isSarvamVoice: true,
      pricing: VOICE_PRICING.sarvam
    }));
  };

  // Get ElevenLabs voices - create sample voices for display
  const getElevenLabsVoices = () => {
    const elevenLabsVoiceNames = ['Adam', 'Rachel', 'Domi'];
    return elevenLabsVoiceNames.map(name => ({
      id: `elevenlabs_${name.toLowerCase()}`,
      name: name,
      description: `ElevenLabs ${name} voice - professional studio quality`,
      language: 'English',
      source: 'elevenlabs',
      provider: 'elevenlabs',
      isElevenLabsVoice: true,
      pricing: VOICE_PRICING.elevenlabs
    }));
  };

  // Get Cartesia voices - use existing voices from "other voices" category
  const getCartesiaVoices = () => {
    // Get voices that are not user voices and not default Indian
    // Fixed: Include Scalysis voices (isScalysisVoice) so they appear in Explore tab
    const cartesiaVoices = voices.filter(v => !v.isUserVoice && !v.isDefaultIndian);
    // Add pricing to each voice and return first 10 voices or all if less than 10
    return cartesiaVoices.slice(0, 10).map(v => ({
      ...v,
      pricing: VOICE_PRICING.cartesia
    }));
  };

  // Get Scalysis V1 voices - create sample voices for display (Inworld)
  const getScalysisV1Voices = () => {
    const v1VoiceNames = ['Aarav', 'Priya', 'Rohan', 'Kavya'];
    return v1VoiceNames.map(name => ({
      id: `scalysis_v1_${name.toLowerCase()}`,
      name: name,
      description: `Scalysis V1 ${name} voice - optimized for high volume calls`,
      language: 'Hindi',
      source: 'scalysis',
      provider: 'scalysis',
      isScalysisV1Voice: true,
      pricing: VOICE_PRICING.scalysis_v1
    }));
  };

  // Get Rime voices - create sample voices for display
  const getRimeVoices = () => {
    const rimeVoiceNames = ['Luna', 'Kai', 'Zara'];
    return rimeVoiceNames.map(name => ({
      id: `rime_${name.toLowerCase()}`,
      name: name,
      description: `Rime ${name} voice - ultra realistic with emotions`,
      language: 'English',
      source: 'rime',
      provider: 'rime',
      isRimeVoice: true,
      pricing: VOICE_PRICING.rime
    }));
  };

  // Get Hume voices - create sample voices for display
  const getHumeVoices = () => {
    const humeVoiceNames = ['Nova', 'Echo', 'Sage'];
    return humeVoiceNames.map(name => ({
      id: `hume_${name.toLowerCase()}`,
      name: name,
      description: `Hume ${name} voice - perfect for narration and storytelling`,
      language: 'English',
      source: 'hume',
      provider: 'hume',
      isHumeVoice: true,
      pricing: VOICE_PRICING.hume
    }));
  };

  return (
    <div className="voices-page-new">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Premium Navigation Tabs */}
      <nav className="voices-nav-new">
        <ul className="voices-nav-list">
          <li>
            <button
              className={`voices-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <img src="/images/Raycons Icons Pack (Community)/discover-8532052.svg" alt="Explore" width="16" height="16" />
              <span>Explore</span>
            </button>
          </li>
          <li>
            <button
              className={`voices-nav-item ${activeTab === 'my-voices' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-voices')}
            >
              <img src="/images/Raycons Icons Pack (Community)/profile-tick-8535312.svg" alt="My Voices" width="16" height="16" />
              <span>My Voices</span>
            </button>
          </li>
          <li>
            <button
              className={`voices-nav-item ${activeTab === 'ultra-realistic' ? 'active' : ''}`}
              onClick={() => setActiveTab('ultra-realistic')}
            >
              <img src="/images/Raycons Icons Pack (Community)/voice-square-8532138.svg" alt="Ultra Realistic" width="16" height="16" />
              <span>Ultra Realistic</span>
            </button>
          </li>
          <li>
            <button
              className={`voices-nav-item ${activeTab === 'cloned-voices' ? 'active' : ''}`}
              onClick={() => setActiveTab('cloned-voices')}
            >
              <img src="/images/Raycons Icons Pack (Community)/grid-8535417.svg" alt="Collections" width="16" height="16" />
              <span>Collections</span>
            </button>
          </li>
          <li>
            <button
              className={`voices-nav-item ${activeTab === 'clone-voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('clone-voice')}
            >
              <img src="/images/Raycons Icons Pack (Community)/document-copy-8535493.svg" alt="Cloned Voices" width="16" height="16" />
              <span>Cloned Voices</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Search and Filter Bar */}
      <div className="voices-search-bar-new">
        {/* Search Box */}
        <div className="voices-search-wrapper-new">
          <div className="voices-search-icon-wrapper-new">
            <img 
              src="/images/Raycons Icons Pack (Community)/search-normal-8532441.svg" 
              alt="Search" 
              width="16" 
              height="16" 
            />
          </div>
          <input
            type="text"
            className="voices-search-input-new"
            placeholder="Search library voices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchVoices()}
          />
        </div>
        
        {/* Filter Icon Button */}
        <button 
          className={`voices-filter-btn-new ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Filters"
        >
          <img 
            src="/images/Raycons Icons Pack (Community)/filter-8532415.svg" 
            alt="Filter" 
            width="20" 
            height="20" 
          />
        </button>
        
        {/* Clone Icon Button */}
        <button 
          className="voices-clone-btn-new"
          onClick={() => {
            // Clone functionality - can be implemented later
            console.log('Clone clicked');
          }}
          title="Clone"
        >
          <img 
            src="/images/Raycons Icons Pack (Community)/document-copy-8535493.svg" 
            alt="Clone" 
            width="20" 
            height="20" 
          />
          <span>Clone</span>
        </button>
      </div>

      {/* Use Cases Showcase Section */}
      <div className="use-cases-showcase-section">
        <div className="use-cases-header">
          <h2 className="use-cases-title">Choose According to your Use Case</h2>
          <div className="use-cases-navigation">
            <button 
              className="use-cases-nav-btn"
              onClick={() => {
                const container = document.querySelector('.use-cases-carousel');
                if (container) {
                  container.scrollBy({ left: -320, behavior: 'smooth' });
                }
              }}
              aria-label="Previous use cases"
            >
              &lt;
            </button>
            <button 
              className="use-cases-nav-btn"
              onClick={() => {
                const container = document.querySelector('.use-cases-carousel');
                if (container) {
                  container.scrollBy({ left: 320, behavior: 'smooth' });
                }
              }}
              aria-label="Next use cases"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="use-cases-container">
          {showLeftFade && <div className="use-cases-fade-left"></div>}
          <div 
            ref={useCasesCarouselRef}
            className="use-cases-carousel"
            onScroll={(e) => {
              const container = e.target;
              const scrollLeft = container.scrollLeft;
              const scrollWidth = container.scrollWidth;
              const clientWidth = container.clientWidth;
              
              // Show left fade only if scrolled right
              setShowLeftFade(scrollLeft > 10);
              
              // Show right fade only if there's more content to scroll
              setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
            }}
          >
            {[
              { name: 'Engaging Address Recovery', image: 'address recovery.svg', color: '#E3F2FD' },
              { name: 'COD Order Confirmation', image: 'order confirmation.svg', color: '#FFF9E6' },
              { name: 'Appointment- Booking, Scheduling', image: 'appointment.svg', color: '#E8F5E9' },
              { name: 'Order Reminders- NDRs', image: 'Order Reminder ndr.svg', color: '#F3E5F5' },
              { name: 'Payment Reminders & Prepaid Conversions', image: 'payment reminder.svg', color: '#FFE0E6' },
              { name: 'Intent-Sentiment Capturing', image: 'Intent Capture.svg', color: '#FFF3E0' },
              { name: 'Follow ups, Scheduling & Conversion', image: 'Follow Ups.svg', color: '#E0F2F1' },
              { name: 'Feedbacks, Reasonings & Extractions', image: 'Feedback.svg', color: '#E1BEE7' },
              { name: 'Risk Capturing & Risk reversal', image: 'Risk Capture.svg', color: '#FFE0B2' },
              { name: 'Upselling, Gifting or Thankyou', image: 'Upselling.svg', color: '#C8E6C9' }
            ].map((useCase, index) => (
              <div 
                key={index}
                className="use-case-card"
                style={{ '--card-bg': useCase.color }}
              >
                <div className="use-case-card-left">
                  <img 
                    src={`/images/Usecase/${useCase.image}`}
                    alt={useCase.name}
                    className="use-case-image"
                  />
                </div>
                <div className="use-case-card-right">
                  <div className="use-case-icon">↗</div>
                  <div className="use-case-text">{useCase.name}</div>
                </div>
              </div>
            ))}
          </div>
          {showRightFade && <div className="use-cases-fade-right"></div>}
        </div>
      </div>

      {/* Skeleton Loading for TTS Providers */}
      {activeTab === 'explore' && loading && <SkeletonTTSProviders />}

      {/* Premium Voices Section - Scalysis V3 */}
      {activeTab === 'explore' && !loading && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              Scalysis V3 <span className="premium-voices-price">(~5rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/crown-8535305.svg" alt="Built for T1 T2 T3" width="16" height="16" />
              <span>Built for T1 T2 T3</span>
            </div>
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/emoji-happy-8535308.svg" alt="Laughter & Emotions" width="16" height="16" />
              <span>Laughter & Emotions</span>
            </div>
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Fine-tuned" width="16" height="16" />
              <span>Fine-tuned</span>
            </div>
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/flash-8535583.svg" alt="Lowest Latency" width="16" height="16" />
              <span>Lowest Latency</span>
            </div>
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/document-copy-8535493.svg" alt="Cloning Supported" width="16" height="16" />
              <span>Cloning Supported</span>
            </div>
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/crown-8535305.svg" alt="Ultra Realism" width="16" height="16" />
              <span>Ultra Realism</span>
            </div>
            <div className="premium-voice-badge">
              <img src="/images/Raycons Icons Pack (Community)/flash-8535583.svg" alt="Persuasion" width="16" height="16" />
              <span>Persuasion</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getScalysisV3Voices().map(voice => renderPremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Premium Voices Section - Sarvam */}
      {activeTab === 'explore' && !loading && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              Sarvam <span className="premium-voices-price">(~3.5rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges - Red/Brown Theme */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge sarvam-badge">
              <img src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" alt="Cheapest" width="16" height="16" />
              <span>Cheapest</span>
            </div>
            <div className="premium-voice-badge sarvam-badge">
              <img src="/images/Raycons Icons Pack (Community)/call-2198440.svg" alt="Call Centers" width="16" height="16" />
              <span>Call Centers</span>
            </div>
            <div className="premium-voice-badge sarvam-badge">
              <img src="/images/Raycons Icons Pack (Community)/global-8532041.svg" alt="Local-Indian" width="16" height="16" />
              <span>Local-Indian</span>
            </div>
            <div className="premium-voice-badge sarvam-badge">
              <img src="/images/Raycons Icons Pack (Community)/document-copy-8535493.svg" alt="No Voice Cloning" width="16" height="16" />
              <span>No Voice Cloning</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getSarvamVoices().map(voice => renderSarvamPremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Premium Voices Section - ElevenLabs */}
      {activeTab === 'explore' && !loading && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              ElevenLabs <span className="premium-voices-price">(~11rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges - Black/Grey Theme */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge elevenlabs-badge">
              <img src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" alt="Expensive" width="16" height="16" />
              <span>Expensive</span>
            </div>
            <div className="premium-voice-badge elevenlabs-badge">
              <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Studio" width="16" height="16" />
              <span>Studio</span>
            </div>
            <div className="premium-voice-badge elevenlabs-badge">
              <img src="/images/Raycons Icons Pack (Community)/grid-8535417.svg" alt="All use cases" width="16" height="16" />
              <span>All use cases</span>
            </div>
            <div className="premium-voice-badge elevenlabs-badge">
              <img src="/images/Raycons Icons Pack (Community)/flash-8535583.svg" alt="Versatile" width="16" height="16" />
              <span>Versatile</span>
            </div>
            <div className="premium-voice-badge elevenlabs-badge">
              <img src="/images/Raycons Icons Pack (Community)/document-copy-8535493.svg" alt="Cloning Supported" width="16" height="16" />
              <span>Cloning Supported</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getElevenLabsVoices().map(voice => renderElevenLabsPremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Premium Voices Section - Cartesia */}
      {activeTab === 'explore' && !loading && getCartesiaVoices().length > 0 && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              Cartesia <span className="premium-voices-price">(~7rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge cartesia-badge">
              <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Stable" width="16" height="16" />
              <span>Stable</span>
            </div>
            <div className="premium-voice-badge cartesia-badge">
              <img src="/images/Raycons Icons Pack (Community)/flash-8535583.svg" alt="Versatile" width="16" height="16" />
              <span>Versatile</span>
            </div>
            <div className="premium-voice-badge cartesia-badge">
              <img src="/images/Raycons Icons Pack (Community)/emoji-happy-8535308.svg" alt="Emotions" width="16" height="16" />
              <span>Emotions</span>
            </div>
            <div className="premium-voice-badge cartesia-badge">
              <img src="/images/Raycons Icons Pack (Community)/document-copy-8535493.svg" alt="Cloning Supported" width="16" height="16" />
              <span>Cloning Supported</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getCartesiaVoices().slice(0, 10).map(voice => renderCartesiaPremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Premium Voices Section - Scalysis V1 */}
      {activeTab === 'explore' && !loading && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              Scalysis V1 <span className="premium-voices-price">(~2rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge scalysis-v1-badge">
              <img src="/images/Raycons Icons Pack (Community)/flash-8535583.svg" alt="Built to scale" width="16" height="16" />
              <span>Built to scale</span>
            </div>
            <div className="premium-voice-badge scalysis-v1-badge">
              <img src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" alt="Credit Card Recovery" width="16" height="16" />
              <span>Credit Card Recovery</span>
            </div>
            <div className="premium-voice-badge scalysis-v1-badge">
              <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Very Basic" width="16" height="16" />
              <span>Very Basic</span>
            </div>
            <div className="premium-voice-badge scalysis-v1-badge">
              <img src="/images/Raycons Icons Pack (Community)/grid-8535417.svg" alt="Optimised for 100k calls perday" width="16" height="16" />
              <span>Optimised for 100k calls perday</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getScalysisV1Voices().map(voice => renderScalysisV1PremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Premium Voices Section - Rime */}
      {activeTab === 'explore' && !loading && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              Rime <span className="premium-voices-price">(~8rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge rime-badge">
              <img src="/images/Raycons Icons Pack (Community)/emoji-happy-8535308.svg" alt="Emotions" width="16" height="16" />
              <span>Emotions</span>
            </div>
            <div className="premium-voice-badge rime-badge">
              <img src="/images/Raycons Icons Pack (Community)/crown-8535305.svg" alt="Ultra Realism" width="16" height="16" />
              <span>Ultra Realism</span>
            </div>
            <div className="premium-voice-badge rime-badge">
              <img src="/images/Raycons Icons Pack (Community)/global-8532041.svg" alt="Suitable with foreign languages" width="16" height="16" />
              <span>Suitable with foreign languages</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getRimeVoices().map(voice => renderRimePremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Premium Voices Section - Hume */}
      {activeTab === 'explore' && !loading && (
        <div className="premium-voices-section">
          <div className="premium-voices-header">
            <h2 className="premium-voices-title">
              Hume <span className="premium-voices-price">(~8rs/min)</span>
              <button className="premium-voices-see-all">
                <span>See all</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </h2>
          </div>
          
          {/* Feature Badges */}
          <div className="premium-voices-badges">
            <div className="premium-voice-badge hume-badge">
              <img src="/images/Raycons Icons Pack (Community)/flash-8535583.svg" alt="Versatile" width="16" height="16" />
              <span>Versatile</span>
            </div>
            <div className="premium-voice-badge hume-badge">
              <img src="/images/Raycons Icons Pack (Community)/voice-square-8532138.svg" alt="Narration" width="16" height="16" />
              <span>Narration</span>
            </div>
            <div className="premium-voice-badge hume-badge">
              <img src="/images/Raycons Icons Pack (Community)/book-8535533.svg" alt="Storytelling" width="16" height="16" />
              <span>Storytelling</span>
            </div>
            <div className="premium-voice-badge hume-badge">
              <img src="/images/Raycons Icons Pack (Community)/message-2198428.svg" alt="Long conversations" width="16" height="16" />
              <span>Long conversations</span>
            </div>
          </div>
          
          {/* Premium Voice Cards */}
          <div className="premium-voices-container-wrapper">
            <div className="premium-voices-container">
              {getHumeVoices().map(voice => renderHumePremiumVoiceCard(voice))}
            </div>
            <div className="premium-voices-fade-right"></div>
          </div>
        </div>
      )}

      {/* Voice Assignment Modal */}
      {showAssignModal && selectedVoiceForAssignment && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Assign Voice to Agent</h2>
            <p className="modal-description">
              Select an agent to assign "{selectedVoiceForAssignment.name}" to:
            </p>
            <div className="modal-list">
              {agents.length === 0 ? (
                <div className="modal-empty">No agents found. Create an agent first.</div>
              ) : (
                agents.map((agent) => (
                  <button
                    key={agent.id}
                    className="modal-item"
                    onClick={() => handleAssignVoiceToAgent(agent.id)}
                  >
                    {agent.name}
                  </button>
                ))
              )}
            </div>
            <button className="modal-cancel-btn" onClick={() => {
                setShowAssignModal(false);
                setSelectedVoiceForAssignment(null);
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Voice Preview Modal */}
      {selectedVoiceForPreview && (
        <div className="modal-overlay" id="voicePreviewModal" onClick={(e) => {
          if (e.target.id === 'voicePreviewModal') {
            handleCloseVoicePreview();
          }
        }}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-back-btn" onClick={handleCloseVoicePreview}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="modal-header-content">
                <h3 className="modal-voice-name">{selectedVoiceForPreview.name}</h3>
                <div className="modal-voice-meta">
                  {selectedVoiceForPreview.language || 'Unknown'} 
                  {selectedVoiceForPreview.languages ? ` (STT: ${selectedVoiceForPreview.languages.join('/')})` : ''}
                </div>
              </div>
            </div>

            <div className="modal-preview-section">
              <label className="modal-label">Enter text to preview</label>
              <textarea
                className="modal-textarea"
                value={voicePreviewText}
                onChange={(e) => setVoicePreviewText(e.target.value)}
                placeholder="Type the text you want to hear..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSpeakVoice();
                  }
                }}
              />
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={handleCloseVoicePreview}>
                Cancel
              </button>
              <button
                className={`modal-speak-btn ${isPlayingVoice ? 'playing' : ''}`}
                onClick={handleSpeakVoice}
                disabled={!voicePreviewText.trim() || isPlayingVoice}
              >
                {isPlayingVoice ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                      <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                    </svg>
                    Playing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                    </svg>
                    Speak
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Settings Modal */}
      {showPreviewSettings && (
        <div className="modal-overlay" onClick={() => setShowPreviewSettings(false)}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Preview Text Settings</h2>
              <button className="modal-back-btn" onClick={() => setShowPreviewSettings(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-preview-section">
              <label className="modal-label">English Preview Text</label>
              <textarea
                className="modal-textarea"
                value={customEnglishText}
                onChange={(e) => setCustomEnglishText(e.target.value)}
                placeholder="Enter English preview text..."
                rows={4}
              />
            </div>

            <div className="modal-preview-section">
              <label className="modal-label">Hinglish Preview Text</label>
              <textarea
                className="modal-textarea"
                value={customHinglishText}
                onChange={(e) => setCustomHinglishText(e.target.value)}
                placeholder="Enter Hinglish preview text..."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="modal-cancel-btn" 
                onClick={() => {
                  // Reset to defaults
                  setCustomEnglishText('Did you order uhh perfora toothpaste right? [laughter] uhh I just wanted to confirm these, and your address is near pretty day apartments. umm what is the landmark for the same? ');
                  setCustomHinglishText('Aapne Perfora toothpaste uhh order kiya tha, Bas address correct karna hai. uhh Aapka address Pretty Day Apartments ke paas  hai na? Aur uhh isme Landmark kya daalu?');
                  localStorage.removeItem('voicePreviewEnglish');
                  localStorage.removeItem('voicePreviewHinglish');
                }}
              >
                Reset to Default
              </button>
              <button
                className="modal-speak-btn"
                onClick={() => {
                  // Save to localStorage
                  localStorage.setItem('voicePreviewEnglish', customEnglishText);
                  localStorage.setItem('voicePreviewHinglish', customHinglishText);
                  setShowPreviewSettings(false);
                  alert('Preview texts saved! All voice previews will now use these texts.');
                }}
              >
                Save Settings
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Voice Name/Description Modal */}
      {editingVoice && (
        <div className="modal-overlay" onClick={() => setEditingVoice(null)}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Voice</h2>
              <button className="modal-back-btn" onClick={() => setEditingVoice(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-preview-section">
              <label className="modal-label">Voice Name</label>
              <input
                type="text"
                className="modal-textarea"
                value={editedVoiceName}
                onChange={(e) => setEditedVoiceName(e.target.value)}
                placeholder="Enter voice name..."
                style={{ minHeight: 'auto', padding: '12px' }}
              />
            </div>

            <div className="modal-preview-section">
              <label className="modal-label">Description</label>
              <textarea
                className="modal-textarea"
                value={editedVoiceDescription}
                onChange={(e) => setEditedVoiceDescription(e.target.value)}
                placeholder="Enter voice description..."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="modal-cancel-btn" 
                onClick={() => {
                  setEditingVoice(null);
                  setEditedVoiceName('');
                  setEditedVoiceDescription('');
                }}
              >
                Cancel
              </button>
              <button
                className="modal-speak-btn"
                onClick={() => {
                  // Save customizations
                  const updated = {
                    ...voiceCustomizations,
                    [editingVoice]: {
                      name: editedVoiceName.trim() || undefined,
                      description: editedVoiceDescription.trim() || undefined
                    }
                  };
                  // Remove entries with no customizations
                  Object.keys(updated).forEach(key => {
                    if (!updated[key].name && !updated[key].description) {
                      delete updated[key];
                    }
                  });
                  setVoiceCustomizations(updated);
                  localStorage.setItem('voiceCustomizations', JSON.stringify(updated));
                  setEditingVoice(null);
                  setEditedVoiceName('');
                  setEditedVoiceDescription('');
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Voice Tab Content - Show Cloned Voices */}
      {activeTab === 'clone-voice' && (
        <div className="voices-list-container" style={{ marginTop: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>Loading cloned voices...</div>
            </div>
          ) : clonedVoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#6B7280', marginBottom: '8px' }}>No cloned voices yet</div>
              <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Create your first cloned voice to get started</div>
            </div>
          ) : (
            <div className="voice-rows-container">
              {clonedVoices.map(voice => renderVoiceRow(voice))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Voices;
