import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './Billing.css';
// Logo imports - using public paths since logos directory doesn't exist
const scalysisLogo = '/images/shopify-logo-svg-vector.svg'; // Placeholder - update with actual Scalysis logo
const blandLogo = '/images/shopify-logo-svg-vector.svg'; // Placeholder - update with actual Bland AI logo
const retellLogo = '/images/shopify-logo-svg-vector.svg'; // Placeholder - update with actual Retell AI logo
const vapiLogo = '/images/shopify-logo-svg-vector.svg'; // Placeholder - update with actual VAPI logo
const elevenLabsLogo = '/images/shopify-logo-svg-vector.svg'; // Placeholder - update with actual ElevenLabs logo

const Billing = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');

  const plans = [
    {
      id: 'starter',
      title: 'Starter',
      description: 'Perfect for getting started with AI calling',
      price: '₹5.50',
      priceUnit: 'per call',
      volume: 'Up to 300 calls/month',
      buttonText: 'Get Started',
      buttonStyle: 'primary',
      features: [
        '300 calls per month (10 calls/day)',
        'Basic AI calling features',
        'Standard support',
        'Call analytics dashboard'
      ]
    },
    {
      id: 'growth',
      title: 'Growth',
      description: 'Scale your operations with higher volume',
      price: '₹5.00',
      priceUnit: 'per call',
      volume: '300 - 1,500 calls/month',
      buttonText: 'Get Started',
      buttonStyle: 'primary',
      features: [
        '300 - 1,500 calls per month (10-50 calls/day)',
        'All Starter features',
        'Priority support',
        'Advanced analytics',
        'Custom call scripts'
      ]
    },
    {
      id: 'scale',
      title: 'Scale',
      description: 'Best value for high-volume operations',
      price: '₹4.50',
      priceUnit: 'per call',
      volume: '1,500 - 10,000 calls/month',
      buttonText: 'Get Started',
      buttonStyle: 'primary',
      isPopular: true,
      features: [
        '1,500 - 10,000 calls per month (50-333 calls/day)',
        'All Growth features',
        'Dedicated support',
        'Advanced integrations',
        'Custom reporting',
        'API access'
      ]
    },
    {
      id: 'business',
      title: 'Business',
      description: 'Enterprise-grade solution with custom pricing',
      price: "Let's Talk",
      priceUnit: '',
      volume: '10,000+ calls/month',
      buttonText: 'Contact Sales',
      buttonStyle: 'secondary',
      features: [
        '10,000+ calls per month (333+ calls/day)',
        'All Scale features',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'White-label options',
        'Custom pricing'
      ]
    }
  ];

  return (
    <div className="billing-page">
      <div className="billing-container">
        <div className="billing-header">
          <h1 className="billing-title">Choose the plan that fits your needs</h1>
        </div>

        <div className="billing-plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`billing-plan-card ${plan.isPopular ? 'billing-plan-card--popular' : ''}`}
            >
              {plan.isPopular && (
                <div className="billing-plan-badge">MOST POPULAR</div>
              )}
              
              <div className="billing-plan-header">
                <h3 className="billing-plan-title">{plan.title}</h3>
                <p className="billing-plan-description">{plan.description}</p>
              </div>

              <div className="billing-plan-pricing">
                <div className="billing-plan-price">
                  <span className="billing-plan-price-amount">{plan.price}</span>
                  {plan.priceUnit && (
                    <span className="billing-plan-price-unit">/{plan.priceUnit}</span>
                  )}
                </div>
                <div className="billing-plan-volume">{plan.volume}</div>
              </div>

              <button
                className={`billing-plan-button billing-plan-button--${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </button>

              <div className="billing-plan-features">
                {plan.id === 'starter' ? (
                  <ul className="billing-plan-features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="billing-plan-feature-item">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="billing-plan-feature-icon"
                        >
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <div className="billing-plan-features-header">
                      {plan.id === 'growth' && 'Everything in Starter, and:'}
                      {plan.id === 'scale' && 'Everything in Growth, and:'}
                      {plan.id === 'business' && 'Everything in Scale, and:'}
                    </div>
                    <ul className="billing-plan-features-list">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="billing-plan-feature-item">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="billing-plan-feature-icon"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table Section */}
        <div className="billing-comparison-section">
          <h2 className="billing-comparison-title">Core Comparison Breakdown</h2>
          <p className="billing-comparison-subtitle">See how Scalysis compares to other AI voice platforms</p>
          
          <div className="billing-comparison-table-wrapper">
            <table className="billing-comparison-table">
              <thead>
                <tr>
                  <th className="billing-comparison-th-feature">Features</th>
                  <th className="billing-comparison-th-scalysis">
                    <div className="billing-scalysis-header">
                      <img src={scalysisLogo} alt="Scalysis" />
                      <span>Scalysis</span>
                    </div>
                  </th>
                  <th className="billing-comparison-th-competitor">
                    <span>Ringg AI</span>
                  </th>
                  <th className="billing-comparison-th-competitor">
                    <img src={blandLogo} alt="Bland AI" />
                  </th>
                  <th className="billing-comparison-th-competitor">
                    <img src={retellLogo} alt="Retell AI" />
                  </th>
                  <th className="billing-comparison-th-competitor">
                    <img src={vapiLogo} alt="VAPI" />
                  </th>
                  <th className="billing-comparison-th-competitor">
                    <img src={elevenLabsLogo} alt="ElevenLabs" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="billing-comparison-td-feature">Base Cost</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>₹4.50-₹5.50/call</strong>
                    <div className="billing-comparison-note">Volume-based pricing</div>
                  </td>
                  <td className="billing-comparison-td-competitor">₹13.20/minute (~$0.15) per connected call</td>
                  <td className="billing-comparison-td-competitor">₹7.92/minute (~$0.09)</td>
                  <td className="billing-comparison-td-competitor">₹9.68/minute (~$0.11)</td>
                  <td className="billing-comparison-td-competitor">₹8.80/minute (~$0.10) + ₹3.52 (~$0.04) number/minute</td>
                  <td className="billing-comparison-td-competitor">Voice API pricing varies</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Additional Fees</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>No additional fees</strong>
                    <div className="billing-comparison-note">All-inclusive pricing</div>
                  </td>
                  <td className="billing-comparison-td-competitor">No additional fees</td>
                  <td className="billing-comparison-td-competitor">
                    Voice cloning (₹1.76/minute)<br />
                    Multilingual (₹0.88/minute)
                  </td>
                  <td className="billing-comparison-td-competitor">
                    ElevenLabs voices (₹6.16/minute)<br />
                    Claude 3.5 (₹5.28/minute)
                  </td>
                  <td className="billing-comparison-td-competitor">
                    Voice (₹2.64-₹6.16/minute)<br />
                    Transcription (₹0.88/minute)<br />
                    LLM (₹5.28/minute)
                  </td>
                  <td className="billing-comparison-td-competitor">Per-character pricing model</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Enterprise Plans</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Custom pricing</strong>
                    <div className="billing-comparison-note">Dedicated support & SLA</div>
                  </td>
                  <td className="billing-comparison-td-competitor">
                    As low as ₹6.16/min<br />
                    Dedicated support
                  </td>
                  <td className="billing-comparison-td-competitor">Custom pricing for dedicated infrastructure</td>
                  <td className="billing-comparison-td-competitor">As low as ₹4.40/minute for 10,000+ minutes</td>
                  <td className="billing-comparison-td-competitor">Volume discounts & dedicated Slack support</td>
                  <td className="billing-comparison-td-competitor">Enterprise pricing available</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Core Use Case</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>E-commerce & D2C</strong>
                    <div className="billing-comparison-note">NDR recovery, COD confirmation, customer support</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Enterprise-grade AI call assistants for BFSI, Banking, D2C, healthcare, surveys, compliance</td>
                  <td className="billing-comparison-td-competitor">High-volume outbound calling for sales, scheduling, customer support</td>
                  <td className="billing-comparison-td-competitor">Customizable voice agents for call centers, sales, regulated industries</td>
                  <td className="billing-comparison-td-competitor">Developer-centric platform for building highly customizable voice assistants</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Pricing Model</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Per-call pricing</strong>
                    <div className="billing-comparison-note">₹4.50-₹5.50/call (all inclusive)</div>
                  </td>
                  <td className="billing-comparison-td-competitor">₹13.20/minute per connected call (all inclusive)</td>
                  <td className="billing-comparison-td-competitor">₹7.92/minute + extra fees for advanced features</td>
                  <td className="billing-comparison-td-competitor">₹9.68/minute (usage-based) + ₹176/month per phone number</td>
                  <td className="billing-comparison-td-competitor">₹8.80/minute + ₹3.52 number/minute (modular pricing)</td>
                  <td className="billing-comparison-td-competitor">Per-character or subscription-based</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Billing Precision</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Per-second billing</strong>
                    <div className="billing-comparison-note">Charged per second, no rounding</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Rounds to full minute (45s = 1 minute charge)</td>
                  <td className="billing-comparison-td-competitor">Rounds to full minute (45s = 1 minute charge)</td>
                  <td className="billing-comparison-td-competitor">Rounds to full minute (45s = 1 minute charge)</td>
                  <td className="billing-comparison-td-competitor">Rounds to full minute (45s = 1 minute charge)</td>
                  <td className="billing-comparison-td-competitor">Per-character or subscription-based</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Free Trial</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Free credits available</strong>
                    <div className="billing-comparison-note">Test with real calls</div>
                  </td>
                  <td className="billing-comparison-td-competitor">₹880 free credits (~$10)</td>
                  <td className="billing-comparison-td-competitor">₹176 free credits (~$2)</td>
                  <td className="billing-comparison-td-competitor">₹880 free credits (~$10)</td>
                  <td className="billing-comparison-td-competitor">₹880 free credits (~$10)</td>
                  <td className="billing-comparison-td-competitor">Limited free tier available</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Voice Quality</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>HD Voice Quality</strong>
                    <div className="billing-comparison-note">High-fidelity, multilingual, natural conversations, Indian accents</div>
                  </td>
                  <td className="billing-comparison-td-competitor">High-fidelity, multilingual, natural conversations</td>
                  <td className="billing-comparison-td-competitor">Basic AI voices by default, premium voices at extra cost</td>
                  <td className="billing-comparison-td-competitor">Supports ElevenLabs and custom voices</td>
                  <td className="billing-comparison-td-competitor">Provider-dependent (e.g., ElevenLabs, Deepgram)</td>
                  <td className="billing-comparison-td-competitor">High-quality neural voices</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Voice Cloning</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>FREE</strong>
                    <div className="billing-comparison-note">Unlimited voice cloning included</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Not available</td>
                  <td className="billing-comparison-td-competitor">₹1.66/minute (additional cost)</td>
                  <td className="billing-comparison-td-competitor">Via ElevenLabs integration (paid)</td>
                  <td className="billing-comparison-td-competitor">Via provider (paid)</td>
                  <td className="billing-comparison-td-competitor">Available (paid service)</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Indian Phone Numbers</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>FREE</strong>
                    <div className="billing-comparison-note">Included in all plans</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Available (paid)</td>
                  <td className="billing-comparison-td-competitor">Available (paid)</td>
                  <td className="billing-comparison-td-competitor">₹166/month per number</td>
                  <td className="billing-comparison-td-competitor">Via Twilio/Vonage (paid)</td>
                  <td className="billing-comparison-td-competitor">N/A (voice API only)</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">GPT Analysis</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>FREE</strong>
                    <div className="billing-comparison-note">Included in all plans</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Available</td>
                  <td className="billing-comparison-td-competitor">Available</td>
                  <td className="billing-comparison-td-competitor">Claude 3.5 (₹4.98/minute)</td>
                  <td className="billing-comparison-td-competitor">LLM (₹4.98/minute)</td>
                  <td className="billing-comparison-td-competitor">N/A (voice API only)</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Sentiment Analysis</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>FREE</strong>
                    <div className="billing-comparison-note">Real-time sentiment tracking included</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Available</td>
                  <td className="billing-comparison-td-competitor">Available</td>
                  <td className="billing-comparison-td-competitor">Available</td>
                  <td className="billing-comparison-td-competitor">Custom implementation required</td>
                  <td className="billing-comparison-td-competitor">N/A</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Auto Improving Scripts</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Yes</strong>
                    <div className="billing-comparison-note">Self-learning AI continuously improves</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Manual optimization required</td>
                  <td className="billing-comparison-td-competitor">Manual optimization required</td>
                  <td className="billing-comparison-td-competitor">Manual optimization required</td>
                  <td className="billing-comparison-td-competitor">Developer-managed</td>
                  <td className="billing-comparison-td-competitor">N/A</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Self Growing Data Book</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Yes</strong>
                    <div className="billing-comparison-note">Knowledge base auto-expands from conversations</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Manual updates required</td>
                  <td className="billing-comparison-td-competitor">Manual updates required</td>
                  <td className="billing-comparison-td-competitor">Manual updates required</td>
                  <td className="billing-comparison-td-competitor">Developer-managed</td>
                  <td className="billing-comparison-td-competitor">N/A</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Data Collected For Learning</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Yes - Unique Feature</strong>
                    <div className="billing-comparison-note">Only Scalysis learns from every conversation</div>
                  </td>
                  <td className="billing-comparison-td-competitor">No</td>
                  <td className="billing-comparison-td-competitor">No</td>
                  <td className="billing-comparison-td-competitor">No</td>
                  <td className="billing-comparison-td-competitor">No</td>
                  <td className="billing-comparison-td-competitor">No</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Latency</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>&lt;350ms</strong>
                    <div className="billing-comparison-note">Ultra-low latency for natural conversations</div>
                  </td>
                  <td className="billing-comparison-td-competitor">&lt;350ms</td>
                  <td className="billing-comparison-td-competitor">400ms</td>
                  <td className="billing-comparison-td-competitor">1000ms+</td>
                  <td className="billing-comparison-td-competitor">800ms</td>
                  <td className="billing-comparison-td-competitor">N/A (voice API only)</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Multilingual Support</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Yes</strong>
                    <div className="billing-comparison-note">Full multilingual support included</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Yes</td>
                  <td className="billing-comparison-td-competitor">Yes (additional cost for some languages)</td>
                  <td className="billing-comparison-td-competitor">Extensive multilingual capabilities</td>
                  <td className="billing-comparison-td-competitor">Yes (depends on provider)</td>
                  <td className="billing-comparison-td-competitor">Yes</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Customization</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>No-code builder</strong>
                    <div className="billing-comparison-note">Easy script editor with visual workflow</div>
                  </td>
                  <td className="billing-comparison-td-competitor">No-code drag-and-drop workflow builder</td>
                  <td className="billing-comparison-td-competitor">API-driven with dynamic pathways, requires technical setup</td>
                  <td className="billing-comparison-td-competitor">Flexible agent design with multi-LLM support</td>
                  <td className="billing-comparison-td-competitor">Full-stack developer tools and modular architecture</td>
                  <td className="billing-comparison-td-competitor">API-based customization</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Integrations</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Shopify, NimbusPost, Shiprocket</strong>
                    <div className="billing-comparison-note">E-commerce focused integrations</div>
                  </td>
                  <td className="billing-comparison-td-competitor">CRM, ERP, Custom integrations</td>
                  <td className="billing-comparison-td-competitor">CRM, ERP, custom APIs</td>
                  <td className="billing-comparison-td-competitor">SIP trunking, CRM, knowledge bases</td>
                  <td className="billing-comparison-td-competitor">Twilio, Vonage, custom APIs</td>
                  <td className="billing-comparison-td-competitor">API integrations</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Scalability</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Unlimited concurrent calls</strong>
                    <div className="billing-comparison-note">Enterprise-grade infrastructure</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Unlimited* concurrent calls, enterprise-grade infrastructure</td>
                  <td className="billing-comparison-td-competitor">20,000+ calls/hour, 99.99% uptime</td>
                  <td className="billing-comparison-td-competitor">Millions of calls/month, 99.99% uptime</td>
                  <td className="billing-comparison-td-competitor">Developer-managed concurrency, scalable via API</td>
                  <td className="billing-comparison-td-competitor">High scalability</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Analytics & Reporting</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>Real-time analytics</strong>
                    <div className="billing-comparison-note">Comprehensive dashboards with call insights</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Real-time performance metrics and dashboards, Post call custom analytics</td>
                  <td className="billing-comparison-td-competitor">Post-call analytics via API</td>
                  <td className="billing-comparison-td-competitor">Real-time analytics, call summaries, and compliance tracking</td>
                  <td className="billing-comparison-td-competitor">Customizable dashboards and call logs</td>
                  <td className="billing-comparison-td-competitor">Basic analytics</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Compliance</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>GDPR, SOC2</strong>
                    <div className="billing-comparison-note">Enterprise-grade security</div>
                  </td>
                  <td className="billing-comparison-td-competitor">ISO, SOC2</td>
                  <td className="billing-comparison-td-competitor">SOC2, GDPR, HIPAA</td>
                  <td className="billing-comparison-td-competitor">HIPAA, SOC2, GDPR</td>
                  <td className="billing-comparison-td-competitor">GDPR-compliant, supports custom security protocols</td>
                  <td className="billing-comparison-td-competitor">GDPR compliant</td>
                </tr>
                <tr>
                  <td className="billing-comparison-td-feature">Best For</td>
                  <td className="billing-comparison-td-scalysis">
                    <strong>E-commerce & D2C brands</strong>
                    <div className="billing-comparison-note">NDR recovery, COD confirmation, customer support automation</div>
                  </td>
                  <td className="billing-comparison-td-competitor">Enterprises | Mid market who wants to go live & scale faster</td>
                  <td className="billing-comparison-td-competitor">Tech teams requiring high-volume outbound calls with basic customization</td>
                  <td className="billing-comparison-td-competitor">Mid-market to enterprise businesses prioritizing compliance and flexibility</td>
                  <td className="billing-comparison-td-competitor">Developers and startups needing full control over voice AI architecture</td>
                  <td className="billing-comparison-td-competitor">Developers building voice applications</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;

