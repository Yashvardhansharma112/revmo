"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  MessageCircle, 
  Phone, 
  Clock, 
  Users, 
  Palette,
  Split,
  Eye,
  Send,
  Sparkles,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  GripVertical,
  Settings2,
  MoreVertical
} from "lucide-react";
import Link from "next/link";

type StepType = 'whatsapp' | 'voice' | 'delay';

interface CampaignStep {
  id: string;
  type: StepType;
  content: string;
  delay_value?: number;
  delay_unit?: 'minutes' | 'hours' | 'days';
  voice_id?: string;
}

type WizardStep = 1 | 2 | 3 | 4;

export default function NewCampaignClient() {
  const router = useRouter();
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  
  // Campaign State
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    is_ab_test: false,
    quiet_hours_enabled: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    segment: "abandoned_cart_7d",
    variants: [
      { 
        name: "Variant A (Control)", 
        is_control: true,
        steps: [
          { id: '1', type: 'whatsapp', content: "Hey {{name}}, we noticed you left something in your cart! Use code SAVE10 for 10% off." } as CampaignStep
        ]
      },
      { 
        name: "Variant B", 
        is_control: false,
        steps: [
          { id: '1', type: 'whatsapp', content: "Hi {{name}}! Is there anything we can help you with regarding your recent order?" } as CampaignStep
        ]
      }
    ]
  });

  const [activeVariantIdx, setActiveVariantIdx] = useState(0);

  const nextStep = () => setWizardStep((s) => (s + 1) as WizardStep);
  const prevStep = () => setWizardStep((s) => (s - 1) as WizardStep);

  const addStep = (type: StepType) => {
    const newVariants = [...campaignData.variants];
    const newStep: CampaignStep = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'delay' ? '' : 'New ' + type + ' step...',
      delay_value: type === 'delay' ? 24 : undefined,
      delay_unit: type === 'delay' ? 'hours' : undefined,
    };
    newVariants[activeVariantIdx].steps.push(newStep);
    setCampaignData({ ...campaignData, variants: newVariants });
  };

  const removeStep = (variantIdx: number, stepIdx: number) => {
    const newVariants = [...campaignData.variants];
    newVariants[variantIdx].steps.splice(stepIdx, 1);
    setCampaignData({ ...campaignData, variants: newVariants });
  };

  const updateStep = (variantIdx: number, stepIdx: number, updates: Partial<CampaignStep>) => {
    const newVariants = [...campaignData.variants];
    newVariants[variantIdx].steps[stepIdx] = { ...newVariants[variantIdx].steps[stepIdx], ...updates };
    setCampaignData({ ...campaignData, variants: newVariants });
  };

  const handleLaunch = async () => {
    setLoading(true);
    try {
       const response = await fetch("/api/campaigns", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           ...campaignData,
           agent_type: 'sequence' // Identifying this as a multi-step campaign
         }),
       });

       if (response.ok) {
         router.push("/campaigns");
         router.refresh();
       } else {
         const error = await response.json();
         alert("Error: " + error.error);
       }
    } catch (error) {
       console.error("Launch failed:", error);
    } finally {
       setLoading(false);
    }
  };

  const renderStepIcon = (s: number, label: string) => (
    <div className="flex flex-col items-center gap-2 relative">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
        wizardStep === s ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg shadow-[rgba(124,58,237,0.3)]" : 
        wizardStep > s ? "bg-[#4ade80] border-[#4ade80] text-white" : 
        "bg-[rgba(255,255,255,0.03)] border-[var(--color-border-glass)] text-[var(--color-text-muted)]"
      }`}>
        {wizardStep > s ? <Check className="w-5 h-5" /> : <span>{s}</span>}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${wizardStep === s ? "text-white" : "text-[var(--color-text-muted)]"}`}>{label}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Link href="/campaigns" className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Campaigns
        </Link>
        <div className="flex items-center gap-8 relative px-4">
           {/* Progress Line */}
           <div className="absolute top-5 left-0 right-0 h-[2px] bg-[rgba(255,255,255,0.05)] mx-12"></div>
           {renderStepIcon(1, "Goal")}
           {renderStepIcon(2, "Audience")}
           {renderStepIcon(3, "Sequence")}
           {renderStepIcon(4, "Launch")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
        {/* ── Main Workspace ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-8 flex-1 flex flex-col">
            
            {/* Step 1: Goal & Settings */}
            {wizardStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[var(--color-accent)]" />
                    Define the campaign goal
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">What are we trying to achieve with this outreach?</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Campaign Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Summer Flash Sale Recovery" 
                      className="w-full h-12 px-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--color-border-glass)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-[rgba(124,58,237,0.05)] to-transparent border border-[var(--color-border-glass)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(124,58,237,0.1)] flex items-center justify-center">
                          <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Quiet Hours Active</div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">Agents only work between 8 AM and 10 PM</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={campaignData.quiet_hours_enabled} onChange={(e) => setCampaignData({...campaignData, quiet_hours_enabled: e.target.checked})} />
                        <div className="w-11 h-6 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                      </label>
                    </div>
                    {campaignData.quiet_hours_enabled && (
                       <div className="flex items-center gap-4 animate-in fade-in duration-300">
                          <div className="flex-1 space-y-1">
                             <span className="text-[9px] text-[var(--color-text-muted)]">START</span>
                             <input type="time" defaultValue="22:00" className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-xs" />
                          </div>
                          <div className="flex-1 space-y-1">
                             <span className="text-[9px] text-[var(--color-text-muted)]">END</span>
                             <input type="time" defaultValue="08:00" className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-xs" />
                          </div>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--color-accent)]" />
                    Who should we target?
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">Select the customer segment to receive this campaign.</p>
                </div>

                <div className="space-y-3">
                   {[
                     { id: "abandoned_cart_7d", label: "Abandoned Carts (Last 7 Days)", count: 1452 },
                     { id: "high_v_spenders", label: "High Spenders (> ₹10,000)", count: 843 },
                     { id: "inactive_30d", label: "Inactive Customers (30+ Days)", count: 2190 },
                     { id: "new_subs", label: "Newsletter Subscribers", count: 5431 }
                   ].map((seg) => (
                     <button 
                       key={seg.id}
                       onClick={() => setCampaignData({...campaignData, segment: seg.id})}
                       className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all group ${
                         campaignData.segment === seg.id ? "bg-[rgba(124,58,237,0.1)] border-[var(--color-accent)]" : "bg-[rgba(255,255,255,0.02)] border-[var(--color-border-glass)] hover:border-[rgba(255,255,255,0.1)]"
                       }`}
                     >
                       <div className="flex flex-col">
                          <span className="text-sm font-medium">{seg.label}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">{seg.count.toLocaleString()} customers</span>
                       </div>
                       <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                         campaignData.segment === seg.id ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-border-glass)] group-hover:border-[var(--color-accent)]"
                       }`}>
                          {campaignData.segment === seg.id && <Check className="w-3 h-3 text-white" />}
                       </div>
                     </button>
                   ))}
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                   <AlertCircle className="w-5 h-5 text-blue-400" />
                   <p className="text-xs text-blue-200">
                     Our AI will double-check each recipient's timezone to respect your quiet hour settings.
                   </p>
                </div>
              </div>
            )}

            {/* Step 3: Sequence Builder */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Palette className="w-5 h-5 text-[var(--color-accent)]" />
                      Design your Sequence
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Chain actions to create a high-converting flow.</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setCampaignData({...campaignData, is_ab_test: !campaignData.is_ab_test})}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          campaignData.is_ab_test ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "bg-[rgba(255,255,255,0.03)] border-[var(--color-border-glass)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        {campaignData.is_ab_test ? "A/B TEST ACTIVE" : "ENABLE A/B TEST"}
                      </button>
                  </div>
                </div>

                {/* Tabs for A/B Testing */}
                {campaignData.is_ab_test && (
                  <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 max-w-sm">
                    <button 
                      onClick={() => setActiveVariantIdx(0)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeVariantIdx === 0 ? "bg-[var(--color-accent)] text-white shadow-lg" : "text-[var(--color-text-muted)] hover:text-white"}`}
                    >
                      VARIANT A
                    </button>
                    <button 
                      onClick={() => setActiveVariantIdx(1)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeVariantIdx === 1 ? "bg-[#fbbf24] text-white shadow-lg" : "text-[var(--color-text-muted)] hover:text-white"}`}
                    >
                      VARIANT B
                    </button>
                  </div>
                )}

                {/* Sequence Timeline */}
                <div className="flex-1 relative">
                   <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[var(--color-accent)] via-[rgba(255,255,255,0.05)] to-transparent"></div>
                   
                   <div className="space-y-6 relative">
                      {campaignData.variants[activeVariantIdx].steps.map((step, idx) => (
                        <div key={step.id} className="flex gap-4 group">
                           <div className={`mt-2 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 z-10 transition-all ${
                              step.type === 'whatsapp' ? "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]" :
                              step.type === 'voice' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                              "bg-gray-500/10 border-gray-500/30 text-gray-400"
                           }`}>
                              {step.type === 'whatsapp' && <MessageCircle className="w-6 h-6" />}
                              {step.type === 'voice' && <Phone className="w-6 h-6" />}
                              {step.type === 'delay' && <Clock className="w-6 h-6" />}
                           </div>
                           
                           <div className="flex-1 glass-card p-4 space-y-3 relative group-hover:border-white/20 transition-all">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                    Step {idx + 1}: {step.type.toUpperCase()}
                                 </span>
                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeStep(activeVariantIdx, idx)} className="p-1 px-2 rounded-md hover:bg-red-500/20 text-red-400 text-xs">
                                       <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                              </div>
                              
                              {step.type !== 'delay' ? (
                                <textarea 
                                  className="w-full h-24 p-3 rounded-lg bg-black/20 border border-white/5 text-xs focus:ring-1 focus:ring-[var(--color-accent)] transition-all resize-none outline-none"
                                  placeholder="Enter script here... use {{name}} for personalization"
                                  value={step.content}
                                  onChange={(e) => updateStep(activeVariantIdx, idx, { content: e.target.value })}
                                />
                              ) : (
                                <div className="flex items-center gap-4">
                                   <div className="flex-1">
                                      <input 
                                        type="number" 
                                        className="w-full bg-black/20 border border-white/5 rounded-lg px-4 h-10 text-sm"
                                        value={step.delay_value}
                                        onChange={(e) => updateStep(activeVariantIdx, idx, { delay_value: parseInt(e.target.value) })}
                                      />
                                   </div>
                                   <select 
                                      className="bg-black/20 border border-white/5 rounded-lg px-4 h-10 text-sm outline-none"
                                      value={step.delay_unit}
                                      onChange={(e) => updateStep(activeVariantIdx, idx, { delay_unit: e.target.value as any })}
                                   >
                                      <option value="minutes">Minutes</option>
                                      <option value="hours">Hours</option>
                                      <option value="days">Days</option>
                                   </select>
                                </div>
                              )}
                           </div>
                        </div>
                      ))}

                      {/* Add Action Button */}
                      <div className="flex gap-4">
                         <div className="w-16 flex justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                               <Plus className="w-4 h-4 text-white/20" />
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => addStep('whatsapp')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition">
                               <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                               Add Message
                            </button>
                            <button onClick={() => addStep('voice')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition">
                               <Phone className="w-3.5 h-3.5 text-blue-400" />
                               Add Call
                            </button>
                            <button onClick={() => addStep('delay')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition">
                               <Clock className="w-3.5 h-3.5 text-gray-400" />
                               Add Delay
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Step 4: Final Launch */}
            {wizardStep === 4 && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-10">
                <div className="flex justify-center">
                   <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.1)] flex items-center justify-center border-4 border-[rgba(34,197,94,0.2)]">
                      <Send className="w-10 h-10 text-[#4ade80]" />
                   </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Launch Campaign</h2>
                  <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                    Your sequence is ready to fly. We'll start processing targeting <span className="text-white font-bold">1,452 customers</span> immediately.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto p-6 bg-black/20 rounded-2xl border border-white/5">
                   <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">Sequence Length</div>
                      <div className="text-sm font-medium">{campaignData.variants[0].steps.length} Steps</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">A/B Testing</div>
                      <div className="text-sm font-medium">{campaignData.is_ab_test ? "Active" : "Disabled"}</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">Quiet Hours</div>
                      <div className="text-sm font-medium">Enabled</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">Segment</div>
                      <div className="text-sm font-medium">Abandoned Carts</div>
                   </div>
                </div>

                <button 
                  onClick={handleLaunch}
                  disabled={loading}
                  className="w-full max-w-md h-14 rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[#a78bfa] text-white font-extrabold text-lg shadow-xl shadow-[rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Clock className="w-6 h-6 animate-spin" /> : "LAUNCH CAMPAIGN"}
                </button>
              </div>
            )}

            {/* ── Footer Navigation ── */}
            <div className={`mt-auto pt-8 flex items-center ${wizardStep === 1 ? "justify-end" : "justify-between"}`}>
              {wizardStep > 1 && (
                <button 
                  onClick={prevStep}
                  className="px-6 h-12 rounded-xl text-sm font-bold text-[var(--color-text-muted)] hover:text-white transition flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {wizardStep < 4 && (
                <button 
                  onClick={nextStep}
                  className="px-8 h-12 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--color-border-glass)] text-sm font-bold hover:bg-[rgba(255,255,255,0.1)] transition flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Real-time Preview ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              Live Sequence Preview
            </h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {campaignData.variants[activeVariantIdx].steps.map((step, idx) => {
                if (step.type === 'whatsapp') return (
                  <div key={idx} className="rounded-3xl border border-white/5 bg-[#0b141a] p-4 shadow-xl space-y-3">
                     <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span className="text-[10px] font-bold text-white/50">OUTGOING WHATSAPP</span>
                     </div>
                     <div className="bg-[#dcf8c6] p-3 rounded-xl rounded-tl-none text-[11px] text-gray-800 leading-relaxed">
                        {step.content || "Empty message..."}
                     </div>
                  </div>
                );
                if (step.type === 'voice') return (
                  <div key={idx} className="rounded-3xl border border-white/5 bg-blue-500/5 p-4 shadow-xl space-y-3">
                     <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-bold text-white/50">AI VOICE CALL</span>
                     </div>
                     <div className="p-3 bg-white/5 rounded-xl text-[10px] text-blue-200/70 italic">
                        "{step.content || "Empty script..."}"
                     </div>
                  </div>
                );
                if (step.type === 'delay') return (
                  <div key={idx} className="flex flex-col items-center gap-2 py-2">
                     <div className="w-[1px] h-6 bg-white/10"></div>
                     <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        Wait {step.delay_value} {step.delay_unit}
                     </div>
                     <div className="w-[1px] h-6 bg-white/10"></div>
                  </div>
                );
                return null;
              })}
            </div>
            
            <button className="w-full mt-6 h-12 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-xs font-bold hover:bg-[rgba(255,255,255,0.06)] transition flex items-center justify-center gap-2">
               <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
               Send Sequence Preview to Myself
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
