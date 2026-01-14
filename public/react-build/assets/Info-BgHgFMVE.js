import{r as d,j as e}from"./index-B_YWOrie.js";/* empty css             */const E=()=>{const[s,u]=d.useState(""),[c,p]=d.useState("script-variables"),n={"script-variables":{title:"Script Variables",content:`Script variables allow you to personalize your call scripts with dynamic information from each order. Use these variables in your script content, and they will be automatically replaced with actual order data when making calls.

Available Variables:
• [ORDER_NUMBER] - The order number (e.g., #1038)
• [ORDER_AMOUNT] - The total order amount with currency
• [CUSTOMER_NAME] - The customer's full name
• [CUSTOMER_ADDRESS] - The complete delivery address
• [DELIVERY_DATE] - The expected or actual delivery date

Usage Example:
"Hello [CUSTOMER_NAME], this is regarding your order [ORDER_NUMBER] for [ORDER_AMOUNT]. We wanted to confirm your delivery address: [CUSTOMER_ADDRESS]."

The system will automatically replace these variables with the actual values from the order when the call is made.`},"clone-voice":{title:"How to Mirror Your Voice",content:`Voice cloning allows you to create a custom AI voice that sounds like you. This feature uses advanced AI technology to replicate your voice characteristics.

Steps to Clone Your Voice:

1. Navigate to the Clone Voice page
2. Choose your input method:
   - Record directly using your microphone
   - Upload an audio file (WAV, MP3, or WebM format)

3. For Recording:
   - Click "Start Recording" and speak clearly
   - Read the sample text provided or use your own
   - Click "Stop Recording" when finished
   - Minimum recommended: 10-15 seconds of clear audio

4. For File Upload:
   - Click "Upload Audio File"
   - Select a high-quality audio file
   - Ensure the audio is clear with minimal background noise

5. Review Your Audio:
   - Listen to the recording/upload
   - Use the waveform to select specific portions if needed
   - Adjust noise suppression if necessary

6. Enter Voice Details:
   - Voice Name: Give your cloned voice a name
   - Description: Optional description
   - Language: Select the primary language

7. Click "Clone" to create your voice
   - Processing typically takes 1-2 minutes
   - You'll receive a notification when complete

Best Practices:
• Use a quiet environment with minimal background noise
• Speak clearly and at a normal pace
• Ensure good microphone quality
• Record at least 10-15 seconds for best results
• Use consistent tone and volume throughout

Your cloned voice will be available in the Voices tab and can be assigned to any agent.`}},a=d.useMemo(()=>{if(!s.trim())return null;const t=s.toLowerCase(),r=[];return Object.keys(n).forEach(o=>{const i=n[o],m=i.title.toLowerCase().includes(t),g=i.content.toLowerCase().includes(t);if(m||g){const x=i.content.split(`
`).map((h,y)=>({line:h,index:y})).filter(({line:h})=>h.toLowerCase().includes(t));let l=0;m&&(l+=100),g&&(l+=10),l+=x.length,r.push({sectionKey:o,sectionTitle:i.title,score:l,matchingLines:x.slice(0,3)})}}),r.sort((o,i)=>i.score-o.score)},[s]),f=d.useMemo(()=>{if(!s.trim())return n[c].content;const t=s.toLowerCase();return n[c].content.split(`
`).map(i=>i.toLowerCase().includes(t)?`**${i}**`:i).join(`
`)},[s,c]);return e.jsxs("div",{className:"info-page",children:[e.jsx("div",{className:"info-header",children:e.jsx("p",{className:"info-subtitle",children:"Documentation and guides for using Scalysis"})}),e.jsx("div",{className:"info-search-container",children:e.jsxs("div",{className:"info-search-box",children:[e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",style:{position:"absolute",left:"16px",color:"#9CA3AF"},children:[e.jsx("circle",{cx:"11",cy:"11",r:"8",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M21 21L16.65 16.65",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})]}),e.jsx("input",{type:"text",className:"info-search-input",placeholder:"Search documentation...",value:s,onChange:t=>u(t.target.value)})]})}),a&&a.length>0&&e.jsxs("div",{style:{marginTop:"16px",marginBottom:"24px",padding:"16px",background:"#F9FAFB",borderRadius:"8px",border:"1px solid #E5E7EB"},children:[e.jsxs("h3",{style:{fontSize:"14px",fontWeight:600,marginBottom:"12px",color:"#1F2937"},children:["Search Results (",a.length,")"]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:a.map((t,r)=>e.jsxs("div",{onClick:()=>{p(t.sectionKey),u("")},style:{padding:"12px",background:"white",borderRadius:"6px",border:"1px solid #E5E7EB",cursor:"pointer",transition:"all 0.2s"},onMouseEnter:o=>{o.currentTarget.style.borderColor="#4B5CFF",o.currentTarget.style.boxShadow="0 2px 4px rgba(75, 92, 255, 0.1)"},onMouseLeave:o=>{o.currentTarget.style.borderColor="#E5E7EB",o.currentTarget.style.boxShadow="none"},children:[e.jsx("div",{style:{fontSize:"16px",fontWeight:600,color:"#1F2937",marginBottom:"4px"},children:t.sectionTitle}),t.matchingLines.length>0&&e.jsx("div",{style:{fontSize:"12px",color:"#6B7280",marginTop:"4px"},children:t.matchingLines.map(({line:o},i)=>e.jsxs("div",{style:{marginTop:i>0?"4px":0},children:[o.trim().substring(0,80),o.trim().length>80?"...":""]},i))})]},r))})]}),a&&a.length===0&&e.jsxs("div",{style:{marginTop:"16px",marginBottom:"24px",padding:"16px",background:"#F9FAFB",borderRadius:"8px",border:"1px solid #E5E7EB",textAlign:"center",color:"#6B7280"},children:['No results found for "',s,'"']}),e.jsxs("div",{className:"info-content-wrapper",children:[e.jsxs("div",{className:"info-sidebar",children:[e.jsx("h3",{className:"info-sidebar-title",children:"Topics"}),e.jsx("nav",{className:"info-nav",children:Object.keys(n).map(t=>e.jsx("button",{className:`info-nav-item ${c===t?"active":""}`,onClick:()=>{p(t),u("")},children:n[t].title},t))})]}),e.jsxs("div",{className:"info-main-content",children:[e.jsx("h1",{className:"info-content-title",children:n[c].title}),e.jsx("div",{className:"info-content-body",children:f.split(`
`).map((t,r)=>t.startsWith("**")&&t.endsWith("**")?e.jsx("p",{style:{fontWeight:600,color:"#1F2937",marginBottom:"12px"},children:t.slice(2,-2)},r):t.startsWith("•")?e.jsx("li",{style:{marginBottom:"8px",marginLeft:"20px"},children:t.substring(1).trim()},r):t.trim()===""?e.jsx("br",{},r):e.jsx("p",{style:{marginBottom:"12px",lineHeight:"1.6",color:"#374151"},children:t},r))})]})]})]})};export{E as default};
