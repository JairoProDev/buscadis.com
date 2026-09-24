/**
 * Chatbot Guiado para Creación de Página de Negocio
 * 
 * Experiencia conversacional que guía al usuario paso a paso
 * mientras ve su página formándose en tiempo real.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { businessTheme } from '@/lib/bs-tokens';
import { IconSparkles, IconCheck, IconArrowRight, IconX, IconCamera } from '@/components/Icons';
import { BusinessProfile } from '@/types/business';

interface ChatMessage {
    id: string;
    type: 'bot' | 'user';
    text: string;
    timestamp: Date;
}

interface ChatStep {
    id: string;
    question: string;
    type: 'text' | 'choice' | 'image' | 'color';
    options?: string[];
    field: keyof BusinessProfile | 'skip';
    placeholder?: string;
    optional?: boolean;
}

const ONBOARDING_STEPS: ChatStep[] = [
    {
        id: '1',
        question: '¡Hola! 👋 Vamos a crear tu página juntos. ¿Cómo se llama tu negocio?',
        type: 'text',
        field: 'name',
        placeholder: 'Ej. Cafetería Aroma'
    },
    {
        id: '2',
        question: '¡Genial! 🎉 ¿Qué nombre de usuario quieres para tu link?\n\nSerá: adis.lat/tu-nombre-aqui',
        type: 'text',
        field: 'slug',
        placeholder: 'tu-negocio'
    },
    {
        id: '3',
        question: 'Cuéntame brevemente sobre tu negocio en una o dos líneas',
        type: 'text',
        field: 'description',
        placeholder: 'Ej. Café artesanal y repostería casera en el corazón de la ciudad',
        optional: true
    },
    {
        id: '4',
        question: '¿Tienes un logo? 📸 Súbelo aquí o lo haces después',
        type: 'image',
        field: 'logo_url',
        optional: true
    },
    {
        id: '5',
        question: '¿Quieres agregar una foto de portada para tu página?',
        type: 'image',
        field: 'banner_url',
        optional: true
    },
    {
        id: '6',
        question: '¿De qué color quieres tu página?',
        type: 'color',
        field: 'theme_color',
        options: [...businessTheme.pickerSwatches.slice(0, 6)]
    },
    {
        id: '7',
        question: '¿Cómo pueden contactarte tus clientes? (WhatsApp)',
        type: 'text',
        field: 'contact_whatsapp',
        placeholder: '999999999',
        optional: true
    },
    {
        id: '8',
        question: '¡Casi listo! ¿Tienes productos para mostrar ahora?',
        type: 'choice',
        field: 'skip',
        options: ['Sí, agregar ahora', 'Lo haré después']
    }
];

interface ChatbotGuideProps {
    profile: Partial<BusinessProfile> | null;
    onUpdate: (field: keyof BusinessProfile, value: any) => void;
    onComplete: () => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    hideTriggerButton?: boolean;
}

export default function ChatbotGuide({ profile, onUpdate, onComplete, isMinimized, onToggleMinimize, hideTriggerButton = false }: ChatbotGuideProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);

    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    const isComplete = currentStepIndex >= ONBOARDING_STEPS.length;

    // Intelligent Start Logic
    useEffect(() => {
        if (!initialized.current && profile) {
            let startIndex = 0;
            // Iterate through steps to find the first missing required field
            // or continue from where we left off (simplified logic)
            for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
                const step = ONBOARDING_STEPS[i];
                const fieldVal = profile[step.field as keyof BusinessProfile];

                // If field has value, we might skip, but let's be careful.
                // We basically want to find the first *empty* field to ask about.
                if (step.field !== 'skip' && fieldVal && fieldVal.toString().length > 0) {
                    startIndex = i + 1;
                } else {
                    // Found an empty field, stop here
                    break;
                }
            }

            // Ensure we don't go out of bounds
            startIndex = Math.min(startIndex, ONBOARDING_STEPS.length - 1);

            // If all done, maybe show a "Can I help you edit?" message instead of step 0
            setCurrentStepIndex(startIndex);
            initialized.current = true;

            const startStep = ONBOARDING_STEPS[startIndex];
            if (startStep) {
                setTimeout(() => {
                    // Custom greeting if skipping
                    const text = startIndex > 0
                        ? `¡Hola de nuevo! 👋 Continuemos. ${startStep.question}`
                        : startStep.question;
                    addBotMessage(text);
                }, 500);
            }
        }
    }, [profile]); // Remove messages dependency to avoid loop

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addBotMessage = (text: string) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => {
                // Prevent duplicates based on text and recent timestamp
                const isDuplicate = prev.some(m => m.text === text && Date.now() - m.timestamp.getTime() < 1000);
                if (isDuplicate) return prev;

                return [...prev, {
                    id: Date.now().toString(),
                    type: 'bot',
                    text,
                    timestamp: new Date()
                }];
            });
            setIsTyping(false);
        }, 600);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            text,
            timestamp: new Date()
        }]);
    };

    const handleNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < ONBOARDING_STEPS.length) {
            setCurrentStepIndex(nextIndex);
            const nextStep = ONBOARDING_STEPS[nextIndex];
            setTimeout(() => {
                addBotMessage(nextStep.question);
            }, 800);
        } else {
            // Completado
            addBotMessage('¡Tu página está lista! 🎉 Puedes publicarla ahora o seguir editándola.');
            setTimeout(() => {
                onComplete();
            }, 2000);
        }
    };

    const handleSubmit = (value?: string) => {
        const val = value || inputValue.trim();

        if (!val && !currentStep.optional) return;

        // Agregar respuesta del usuario
        if (currentStep.type === 'text') {
            addUserMessage(val);
            onUpdate(currentStep.field as keyof BusinessProfile, val);
        } else if (currentStep.type === 'choice') {
            addUserMessage(val);
        }

        setInputValue('');
        handleNext();
    };

    const handleSkip = () => {
        addUserMessage('Lo haré después');
        handleNext();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            onUpdate(currentStep.field as keyof BusinessProfile, dataUrl);
            addUserMessage(`✅ Imagen subida`);
            handleNext();
        };
        reader.readAsDataURL(file);
    };

    const handleColorSelect = (color: string) => {
        onUpdate(currentStep.field as keyof BusinessProfile, color);
        addUserMessage(`Color seleccionado`);
        handleNext();
    };

    const handleChoiceSelect = (choice: string) => {
        addUserMessage(choice);
        if (choice === 'Sí, agregar ahora') {
            // Trigger catalog flow
        }
        handleNext();
    };

    if (isMinimized) {
        if (hideTriggerButton) return null;
        
        return (
            <button
                onClick={onToggleMinimize}
                className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 animate-bounce hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--brand-blue)' }}
                title="Abrir Asistente"
            >
                <IconSparkles size={24} color="white" />
            </button>
        );
    }

    return (
        <div
            className="fixed z-40 bg-white shadow-2xl flex flex-col transition-all duration-300 bottom-0 left-0 right-0 h-[45vh] border-t-2 md:top-[64px] md:bottom-0 md:right-0 md:left-auto md:h-[calc(100vh-64px)] md:w-[400px] md:border-t-0 md:border-l-2"
            style={{
                borderColor: 'var(--brand-blue)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            {/* Header */}
            <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{
                    backgroundColor: 'var(--brand-blue)',
                    borderColor: 'var(--border-color)'
                }}
            >
                <div className="flex items-center gap-2 text-white">
                    <IconSparkles size={20} />
                    <span className="font-bold">Tu Asistente Personal</span>
                </div>
                <button
                    onClick={onToggleMinimize}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <IconX size={20} color="white" />
                </button>
            </div >

            {/* Messages */}
            < div className="flex-1 overflow-y-auto p-4 space-y-3" >
                {
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-2 rounded-2xl ${message.type === 'user'
                                    ? 'bg-gradient-to-r text-white'
                                    : 'bg-slate-100'
                                    }`}
                                style={{
                                    backgroundColor: message.type === 'user' ? 'var(--brand-blue)' : undefined,
                                    color: message.type === 'user' ? 'white' : 'var(--text-primary)'
                                }}
                            >
                                {message.text}
                            </div>
                        </div>
                    ))
                }

                {
                    isTyping && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-slate-100">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )
                }

                <div ref={messagesEndRef} />
            </div >

            {/* Input Area */}
            {
                !isComplete && currentStep && (
                    <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        {currentStep.type === 'text' && (
                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={currentStep.placeholder}
                                    className="flex-1 px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                    style={{ borderColor: 'var(--border-color)' }}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() && !currentStep.optional}
                                    className="px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}
                                >
                                    <IconArrowRight size={18} />
                                </button>
                                {currentStep.optional && (
                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="px-4 py-3 rounded-xl font-medium transition-colors hover:bg-slate-100"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Saltar
                                    </button>
                                )}
                            </form>
                        )}

                        {currentStep.type === 'choice' && currentStep.options && (
                            <div className="grid grid-cols-2 gap-3">
                                {currentStep.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleChoiceSelect(option)}
                                        className="px-4 py-3 rounded-xl font-bold text-white transition-all hover:shadow-lg"
                                        style={{ backgroundColor: idx === 0 ? 'var(--brand-blue)' : 'var(--brand-yellow)' }}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentStep.type === 'image' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}
                                >
                                    <IconCamera size={18} />
                                    Subir Imagen
                                </button>
                                {currentStep.optional && (
                                    <button
                                        onClick={handleSkip}
                                        className="px-4 py-3 rounded-xl font-medium transition-colors hover:bg-slate-100"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Lo haré después
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {currentStep.type === 'color' && currentStep.options && (
                            <div className="flex gap-3 justify-center">
                                {currentStep.options.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorSelect(color)}
                                        className="w-12 h-12 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
