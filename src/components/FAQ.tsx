import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('t38'),
      answer: t('t39'),
    },
    { question: t('t134'), answer: t('t41') },
    { question: t('t42'), answer: t('t43') },
    { question: t('t44'), answer: t('t45') },
    { question: t('t46'), answer: t('t47') },
    { question: t('t48'), answer: t('t49') },
    { question: t('t50'), answer: t('t51') + ' ' + t('t5') + ' ' + t('t52') },
    { question: t('t53'), answer: t('t54') },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* FAQ Accordion */}
          <div className="w-full md:w-2/3">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    className="w-full text-start px-6 py-4 flex items-center justify-between font-bold text-secondary focus:outline-none"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span>{faq.question}</span>
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-4 text-gray-600 bg-slate-100 p-4 m-2 rounded text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Title Box */}
          <div className="w-full md:w-1/3">
            <div className="bg-secondary text-white rounded-lg p-12 flex flex-col items-center justify-center h-full text-center min-h-[300px]">
              <HelpCircle className="w-16 h-16 mb-6 opacity-80" />
              <h2 className="text-3xl font-bold">{t('t4')}</h2>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQ;
