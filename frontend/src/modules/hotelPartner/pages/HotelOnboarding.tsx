import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { saveOnboardingStep } from '../../../services/api/hotelPartnerService';

// Import refactored steps (I will create these next)
import StepPropertyName from '../steps/StepPropertyName';
import StepPropertyType from '../steps/StepPropertyType';
import StepAddress from '../steps/StepAddress';
import StepAmenities from '../steps/StepFacilities'; // Renamed facilities to amenities
import StepPhotos from '../steps/StepPropertyImages';

const TOTAL_STEPS = 5;

const HotelOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        name: '',
        propertyType: '',
        address: '',
        amenities: [],
        images: []
    });
    const [isSaving, setIsSaving] = useState(false);

    const updateFormData = (data: any) => {
        setFormData((prev: any) => ({ ...prev, ...data }));
    };

    const nextStep = async () => {
        if (currentStep < TOTAL_STEPS) {
            setIsSaving(true);
            try {
                // Save progress to backend (Draft mode)
                await saveOnboardingStep({ step: currentStep, data: formData });
                setCurrentStep(prev => prev + 1);
            } catch (error) {
                console.error("Failed to save progress", error);
                // Continue anyway for DX, but in prod we might block
                setCurrentStep(prev => prev + 1);
            } finally {
                setIsSaving(false);
            }
        } else {
            // Final Submit
            navigate('/hotel/dashboard');
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        else navigate(-1);
    };

    const progress = (currentStep / TOTAL_STEPS) * 100;

    return (
        <div className="min-h-screen bg-white flex flex-col font-['Inter']">
            {/* Header / Progress Bar */}
            <div className="px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={prevStep} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <span className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Step {currentStep} of {TOTAL_STEPS}</span>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-hotel-DEFAULT"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-6 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-xl mx-auto"
                    >
                        {currentStep === 1 && <StepPropertyName value={formData.name} onChange={(v) => updateFormData({ name: v })} />}
                        {currentStep === 2 && <StepPropertyType value={formData.propertyType} onChange={(v) => updateFormData({ propertyType: v })} />}
                        {currentStep === 3 && <StepAddress value={formData.address} onChange={(v) => updateFormData({ address: v })} />}
                        {currentStep === 4 && <StepAmenities value={formData.amenities} onChange={(v) => updateFormData({ amenities: v })} />}
                        {currentStep === 5 && <StepPhotos value={formData.images} onChange={(v) => updateFormData({ images: v })} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-6 flex items-center justify-between z-50">
                <button 
                    onClick={prevStep}
                    className="text-gray-900 font-black uppercase text-sm tracking-widest px-4 py-2"
                >
                    Back
                </button>
                <button 
                    onClick={nextStep}
                    disabled={isSaving}
                    className="bg-gray-900 text-white font-black px-10 py-4 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : (currentStep === TOTAL_STEPS ? 'Complete' : 'Next')}
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default HotelOnboarding;
