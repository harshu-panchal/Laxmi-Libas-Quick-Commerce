import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="pb-20 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md pb-4 pt-4 sticky top-0 z-10 border-b border-neutral-100">
                <div className="px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
                            aria-label="Back"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Legal Policies</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
                {/* Introduction */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-yellow-500 rounded-full"></div>
                        Introduction
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            This Privacy Policy describes how <strong>LAXMI ENTERPRISES</strong> (collectively & LAXMI ENTERPRISES, we, our, us) collect, use, share, protect or otherwise process your information/ personal data through our website <a href="https://laxmart.store/" className="text-blue-600 hover:underline">https://laxmart.store/</a> (hereinafter referred to as Platform).
                        </p>
                        <p>
                            Please note that you may be able to browse certain sections of the Platform without registering with us. We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India.
                        </p>
                        <p>
                            By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree please do not use or access our Platform.
                        </p>
                    </div>
                </div>

                {/* Collection */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Collection
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time.
                        </p>
                        <p>
                            Some of the information that we may collect includes but is not limited to personal data / information provided to us during sign-up/registering or using our Platform such as name, date of birth, address, telephone/mobile number, email ID and/or any such information shared as proof of identity or address.
                        </p>
                        <p>
                            Some of the sensitive personal data may be collected with your consent, such as your bank account or credit or debit card or other payment instrument information or biometric information such as your facial features or physiological information (in order to enable use of certain features when opted for, available on the Platform) etc all of the above being in accordance with applicable law(s).
                        </p>
                        <p>
                            You always have the option to not provide information, by choosing not to use a particular service or feature on the Platform. We may track your behaviour, preferences, and other information that you choose to provide on our Platform. This information is compiled and analysed on an aggregated basis.
                        </p>
                        <p>
                            We will also collect your information related to your transactions on Platform and such third-party business partner platforms. When such a third-party business partner collects your personal data directly from you, you will be governed by their privacy policies. We shall not be responsible for the third-party business partner’s privacy practices or the content of their privacy policies, and we request you to read their privacy policies prior to disclosing any information.
                        </p>
                        <p className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-700">
                            If you receive an email, a call from a person/association claiming to be <strong>LAXMI ENTERPRISES</strong> seeking any personal data like debit/credit card PIN, net-banking or mobile banking password, we request you to never provide such information. If you have already revealed such information, report it immediately to an appropriate law enforcement agency.
                        </p>
                    </div>
                </div>

                {/* Usage */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                        Usage
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses.
                        </p>
                        <p>
                            We use your personal data to assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; to resolve disputes; troubleshoot problems; inform you about online and offline offers, products, services, and updates; customise your experience; detect and protect us against error, fraud and other criminal activity; enforce our terms and conditions; conduct marketing research, analysis and surveys; and as otherwise described to you at the time of collection of information.
                        </p>
                        <p>
                            You understand that your access to these products/services may be affected in the event permission is not provided to us.
                        </p>
                    </div>
                </div>

                {/* Sharing */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                        Sharing
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out.
                        </p>
                        <p>
                            We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment opted by you.
                        </p>
                        <p>
                            These disclosure may be required for us to provide you access to our services and products offered to you, to comply with our legal obligations, to enforce our user agreement, to facilitate our marketing and advertising activities, to prevent, detect, mitigate, and investigate fraudulent or illegal activities related to our services.
                        </p>
                        <p>
                            We may disclose personal and sensitive personal data to government agencies or other authorised law enforcement agencies if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process.
                        </p>
                        <p>
                            We may disclose personal data to law enforcement offices, third party rights owners, or others in the good faith belief that such disclosure is reasonably necessary to: enforce our Terms of Use or Privacy Policy; respond to claims that an advertisement, posting or other content violates the rights of a third party; or protect the rights, property or personal safety of our users or the general public.
                        </p>
                    </div>
                </div>

                {/* Security Precautions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                        Security Precautions
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server.
                        </p>
                        <p>
                            However, the transmission of information is not completely secure for reasons beyond our control. By using the Platform, the users accept the security implications of data transmission over the internet and the World Wide Web which cannot always be guaranteed as completely secure, and therefore, there would always remain certain inherent risks regarding use of the Platform. Users are responsible for ensuring the protection of login and password records for their account.
                        </p>
                    </div>
                </div>

                {/* Data Deletion and Retention */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                        Data Deletion and Retention
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            You have an option to delete your account by visiting your profile and settings on our Platform , this action would result in you losing all information related to your account. You may also write to us at the contact information provided below to assist you with these requests.
                        </p>
                        <p>
                            We may in event of any pending grievance, claims, pending shipments or any other services we may refuse or delay deletion of the account. Once the account is deleted, you will lose access to the account.
                        </p>
                        <p>
                            We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes. We may continue to retain your data in anonymised form for analytical and research purposes.
                        </p>
                    </div>
                </div>

                {/* Your Rights */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                        Your Rights
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.
                        </p>
                    </div>
                </div>

                {/* Consent */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-pink-500 rounded-full"></div>
                        Consent
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy. If you disclose to us any personal data relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
                        </p>
                        <p>
                            You, while providing your personal data over the Platform or any partner platforms or establishments, consent to us (including our other corporate entities, affiliates, lending partners, technology partners, marketing channels, business partners and other third parties) to contact you through SMS, instant messaging apps, call and/or e-mail for the purposes specified in this Privacy Policy.
                        </p>
                        <p>
                            You have an option to withdraw your consent that you have already provided by writing to the Grievance Officer at the contact information provided below. Please mention “Withdrawal of consent for processing personal data” in your subject line of your communication.
                        </p>
                        <p>
                            We may verify such requests before acting on our request. However, please note that your withdrawal of consent will not be retrospective and will be in accordance with the Terms of Use, this Privacy Policy, and applicable laws. In the event you withdraw consent given to us under this Privacy Policy, we reserve the right to restrict or deny the provision of our services for which we consider such information to be necessary.
                        </p>
                    </div>
                </div>

                {/* Changes to this Privacy Policy */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                        Changes to this Privacy Policy
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert / notify you about the significant changes to the Privacy Policy, in the manner as may be required under applicable laws.
                        </p>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Last Updated: April 2026 • INDIA</p>
                </div>
            </div>
        </div>
    );
}
