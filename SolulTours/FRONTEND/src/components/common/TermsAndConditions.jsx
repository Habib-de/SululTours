// src/components/common/TermsAndConditions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, CheckCircle, AlertCircle, FileText, Shield, AlertTriangle, 
  Car, User, MapPin, Clock, DollarSign, CreditCard, PenTool, 
  Eraser, RotateCcw, Eye 
} from 'lucide-react';

// ============================================
// SIGNATURE PAD COMPONENT (from Checklist.jsx)
// ============================================
const SignaturePad = ({ onSave, onClear, value }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#1a1a1a';
    setCtx(context);

    if (value) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
  }, []);

  const getPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    if (onSave) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onSave) onSave(null);
    if (onClear) onClear();
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        width={600}
        height={150}
        className="w-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      <div className="flex justify-end p-1 bg-gray-50 border-t border-gray-200">
        <button
          onClick={clearSignature}
          className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const TermsAndConditions = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  onDecline,
  title = "Hire Agreement Terms & Conditions",
  serviceType = "car_hire"
}) => {
  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // ✅ Conditional return goes AFTER all hooks
  if (!isOpen) return null;

  const handleAccept = () => {
    if (!accepted) {
      return;
    }
    
    if (hasSignature && !signatureData) {
      alert('Please sign your name before accepting.');
      return;
    }
    
    if (onAccept) {
      onAccept(signatureData);
    }
  };

  const handleDecline = () => {
    if (onDecline) onDecline();
  };

  const handleSignatureSave = (data) => {
    setSignatureData(data);
    setHasSignature(!!data);
  };

  const handleSignatureClear = () => {
    setSignatureData(null);
    setHasSignature(false);
  };

  const openSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
  };

  const confirmSignature = () => {
    if (!signatureData) {
      alert('Please sign your name before confirming.');
      return;
    }
    setShowSignatureModal(false);
  };

  const removeSignature = () => {
    setSignatureData(null);
    setHasSignature(false);
  };

  // ✅ Signature Popup Modal
  const renderSignatureModal = () => {
    if (!showSignatureModal) return null;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
          onClick={closeSignatureModal}
        ></div>
        <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <PenTool size={20} />
              <div>
                <h2 className="text-lg font-semibold">Digital Signature</h2>
                <p className="text-xs text-blue-100">Sign your name in the box below</p>
              </div>
            </div>
            <button 
              onClick={closeSignatureModal} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Please sign your name in the box below using your mouse or finger (on touch devices).
            </p>
            
            <SignaturePad 
              onSave={handleSignatureSave}
              onClear={handleSignatureClear}
              value={signatureData}
            />

            {signatureData && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">Signature captured ✓</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <button
              onClick={closeSignatureModal}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmSignature}
              disabled={!signatureData}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                ${signatureData 
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <CheckCircle size={16} />
              Confirm Signature
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText size={18} className="sm:size-[22px]" />
            <div>
              <h2 className="text-sm sm:text-lg font-semibold">{title}</h2>
              <p className="text-[10px] sm:text-xs text-blue-100">Please read carefully before proceeding</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={18} className="sm:size-[22px]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-yellow-800 flex items-start gap-2 sm:gap-3">
            <AlertCircle size={16} className="sm:size-[20px] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 text-xs sm:text-sm">Important Notice</p>
              <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5 sm:mt-1">
                Please read all terms carefully before accepting. By accepting, you agree to be bound by these terms and conditions.
                This is a legally binding agreement between you (the Hirer) and Sulul Tours &amp; Travel.
              </p>
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
            
            {/* Section 1: Hire Agreement */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                <Car size={14} className="sm:size-[18px] text-blue-600" />
                1. HIRE AGREEMENT
              </h3>
              <p className="text-gray-600 mb-2 text-[11px] sm:text-sm">
                The undersigned is hiring the vehicle in good condition. The hire period is as stated in the booking agreement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-xs">
                <div className="bg-white rounded p-2 border border-gray-100">
                  <span className="text-gray-500 font-medium">Payment Methods:</span>
                  <ul className="list-disc list-inside text-gray-600 ml-1 mt-0.5">
                    <li>Cash</li>
                    <li>Cheque (CHQ)</li>
                    <li>M-Pesa (MPESA)</li>
                  </ul>
                </div>
                <div className="bg-white rounded p-2 border border-gray-100">
                  <span className="text-gray-500 font-medium">Extra Charges:</span>
                  <ul className="list-disc list-inside text-gray-600 ml-1 mt-0.5">
                    <li>Extra km at agreed rate</li>
                    <li>Extra days at daily rate</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2: Driver Requirements */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                <User size={14} className="sm:size-[18px] text-blue-600" />
                2. DRIVER REQUIREMENTS
              </h3>
              <div className="space-y-1.5 text-[11px] sm:text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Hirer must be <strong>23-70 years old</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Valid license</strong> for at least 2 years</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span>License <strong>free from endorsements</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span>No <strong>convictions</strong> for dangerous driving (5 years)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span>No <strong>physical/vision/hearing</strong> defects</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span>No insurer <strong>declined/renewed</strong> with conditions</span>
                </div>
              </div>
            </div>

            {/* Section 3: Vehicle Usage */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex-items-center gap-2 text-xs sm:text-sm">
                <Shield size={14} className="sm:size-[18px] text-blue-600" />
                3. VEHICLE USAGE
              </h3>
              <div className="space-y-1.5 text-[11px] sm:text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Not</strong> for hire/reward passengers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Not</strong> exceed declared passengers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Only</strong> drivers who completed declaration</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="sm:size-[14px] text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Not authorised</strong> for unsafe places</span>
                </div>
              </div>
            </div>

            {/* Section 4: Declaration */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                <FileText size={14} className="sm:size-[18px] text-blue-600" />
                4. STATUTORY DECLARATION
              </h3>
              <p className="text-gray-600 mb-1.5 font-medium text-[11px] sm:text-sm">I declare that:</p>
              <div className="space-y-1 text-[11px] sm:text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 text-[10px] sm:text-xs">a)</span>
                  <span>All statements are <strong>true</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 text-[10px] sm:text-xs">b)</span>
                  <span>Vehicle <strong>not</strong> for hire/reward</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 text-[10px] sm:text-xs">c)</span>
                  <span><strong>Not</strong> exceed declared passengers</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 text-[10px] sm:text-xs">d)</span>
                  <span>License <strong>examined</strong> by operator</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 text-[10px] sm:text-xs">e)</span>
                  <span><strong>Only</strong> persons with declaration form</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500">
                <p>This Declaration is basis of contract with Insurer.</p>
                <p className="mt-0.5 font-semibold">Countersigned: Sulul Tours &amp; Travel</p>
              </div>
            </div>

            {/* Section 5: Important Notice */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                <AlertTriangle size={14} className="sm:size-[18px] text-red-600" />
                5. ⚠️ IMPORTANT NOTICE
              </h3>
              <div className="space-y-1.5 text-red-700 text-[11px] sm:text-sm">
                <p className="font-medium">
                  I AM THE AUTHORISED DRIVER UNLESS OTHER DRIVERS ARE NAMED.
                </p>
                <div className="bg-red-100 rounded-lg p-2 sm:p-3 border border-red-300">
                  <p className="text-[11px] sm:text-sm font-bold text-red-800">
                    ⚠️ VEHICLE HIRED FOR SPECIFIED PERIOD ABOVE.
                  </p>
                  <p className="text-[11px] sm:text-sm font-bold text-red-800 mt-0.5 sm:mt-1">
                    🚨 OVERDUE RETURN = STOLEN VEHICLE = POLICE REPORT
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6: Liability */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle size={14} className="sm:size-[18px] text-orange-600" />
                6. LIABILITY
              </h3>
              <div className="space-y-1.5 text-[11px] sm:text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="sm:size-[14px] text-orange-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Must return</strong> by due date</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="sm:size-[14px] text-orange-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Late return</strong> = stolen vehicle</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="sm:size-[14px] text-orange-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Liable</strong> for all vehicle damage</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="sm:size-[14px] text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Traffic tickets = <strong>court prosecution</strong></span>
                </div>
              </div>
            </div>

            {/* Section 7: Vehicle Condition */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                <Car size={14} className="sm:size-[18px] text-blue-600" />
                7. CHECK-IN
              </h3>
              <ul className="list-disc list-inside text-[11px] sm:text-sm text-gray-600 ml-1 space-y-0.5">
                <li>Check-in at specified place</li>
                <li>Damages documented before hiring</li>
                <li>Date IN / Date OUT recorded</li>
                <li>Kilometres (KMs) recorded</li>
              </ul>
            </div>

            {/* Section 8: Special Conditions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-blue-800 mb-1.5 flex items-center gap-2 text-xs sm:text-sm">
                <Shield size={14} className="sm:size-[18px] text-blue-600" />
                8. SPECIAL CONDITIONS
              </h3>
              <ul className="list-disc list-inside text-[11px] sm:text-sm text-blue-700 ml-1 space-y-0.5">
                <li><strong>Not authorised</strong> for unsafe places</li>
                <li><strong>Liable</strong> for vehicle damage</li>
                <li>Traffic tickets = <strong>court prosecution</strong></li>
                <li>Late return = <strong>stolen vehicle</strong></li>
              </ul>
            </div>

                        {/* Final Acceptance Statement */}
            <div className="bg-gray-900 text-white rounded-lg p-3 sm:p-4 text-center">
              <p className="text-[11px] sm:text-sm font-semibold">
                THIS HIRE IS SUBJECT TO THE TERMS AND CONDITIONS WHICH THE HIRER HAS READ AND AGREED TO ACCEPT THIS CONTRACT WITH THIS COMPANY.
              </p>
              <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] sm:text-xs">
                <div className="flex flex-col items-center gap-2">
                  {/* Signature Display */}
                  <div className="w-full">
                    <p className="text-gray-400 text-[9px] uppercase tracking-wider">Signature of Hirer</p>
                    {hasSignature && signatureData ? (
  <div className="mt-1 flex justify-center">
    <img 
      src={signatureData} 
      alt="Customer Signature" 
      className="max-h-12 object-contain bg-white rounded p-1 border border-gray-300"
    />
  </div>
) : (
  <p className="text-gray-500 text-xs">_________________________</p>
)}
                  </div>
                  
                  {/* Date Display */}
                  <div className="w-full">
                    <p className="text-gray-400 text-[9px] uppercase tracking-wider">Date</p>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {hasSignature && signatureData ? new Date().toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '_________________________'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

                        {/* ✅ Signature Button - Opens Popup */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Digital Signature</p>
                  {hasSignature && signatureData ? (
                    <div className="mt-0.5">
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        ✓ Signed
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Signed on: {new Date().toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Add your signature to complete the agreement</p>
                  )}
                </div>
                {hasSignature && signatureData ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSignatureModal(true)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1 transition-colors"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={removeSignature}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center gap-2 transition-colors"
                    >
                      <X size={16} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openSignatureModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
                  >
                    <PenTool size={16} />
                    Add Signature
                  </button>
                )}
              </div>
              {hasSignature && signatureData && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <img 
                    src={signatureData} 
                    alt="Signature preview" 
                    className="max-h-12 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-2 sm:gap-3 rounded-b-2xl">
          <div className="flex items-start sm:items-center gap-2">
            <input
              type="checkbox"
              id="terms-accept"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 sm:mt-0"
            />
            <label htmlFor="terms-accept" className="text-[10px] sm:text-xs text-gray-700">
              I have read and agree to all the <strong>Terms and Conditions</strong> above
            </label>
          </div>
          
          {!hasSignature && accepted && (
            <div className="text-[10px] sm:text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle size={12} />
              Please add your signature before continuing
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs sm:text-sm transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted || !hasSignature}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                ${accepted && hasSignature
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <CheckCircle size={14} className="sm:size-[16px]" />
              Accept &amp; Continue
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Signature Popup Modal */}
      {renderSignatureModal()}
    </div>
  );
};

export default TermsAndConditions;