"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PayofflinePage() {
  const [amount, setAmount] = useState("");
  const [sipType, setSipType] = useState("");
  const [sipId, setSipId] = useState("");
  const [utrNo, setUtrNo] = useState("");
  const [otp, setOtp] = useState("");
  const [shop, setShop] = useState("Select Shop");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [apiResponse, setApiResponse] = useState("");
  const [isQuickBuy, setIsQuickBuy] = useState(false);
  const [metalType, setMetalType] = useState("");
  const [metalName, setMetalName] = useState("");
  const [grams, setGrams] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if this is a quick buy from Home page
    const checkQuickBuy = () => {
      try {
        // Check if paymentParameters exist in session storage (from Home page)
        const paymentParamsStr = sessionStorage.getItem("paymentParameters");
        const offlinePaymentDataStr = sessionStorage.getItem("offlinePaymentData");
        
        if (paymentParamsStr) {
          const paymentParams = JSON.parse(paymentParamsStr);
          console.log("📋 Payment parameters found:", paymentParams);
          
          // Check if this is a quick buy (sipType = 'quick_buy')
          if (paymentParams.method === 'Offline' && paymentParams.sipType === 'quick_buy') {
            setIsQuickBuy(true);
            
            // Set all fields from quick buy data
            setAmount(paymentParams.amount?.toString() || "");
            setSipType("QUICK_BUY"); // Set to uppercase for consistency
            setSipId(paymentParams.sipId || "");
            setMetalType(paymentParams.metalType || "");
            setMetalName(paymentParams.metalName || "");
            setGrams(paymentParams.grams?.toString() || "");
            
            console.log("✅ Quick buy detected, fields populated from session storage");
            return;
          }
        }
        
        // Also check offlinePaymentData
        if (offlinePaymentDataStr) {
          const offlineData = JSON.parse(offlinePaymentDataStr);
          console.log("📋 Offline payment data found:", offlineData);
          
          if (offlineData.transaction_type === 'OFFLINE') {
            setIsQuickBuy(true);
            
            // Set all fields from offline payment data
            setAmount(offlineData.amount?.toString() || "");
            setSipType("QUICK_BUY");
            setSipId(offlineData.sipId || "");
            setMetalType(offlineData.metalType || "");
            setMetalName(offlineData.metalName || "");
            setGrams(offlineData.grams?.toString() || "");
            
            console.log("✅ Quick buy detected from offline payment data");
            return;
          }
        }

        // If not quick buy, proceed with original logic for SIP payments
        setIsQuickBuy(false);
        console.log("ℹ️ Not a quick buy, using original SIP payment logic");

        const amountPayingValuesStr = sessionStorage.getItem("amountPayingValues");
        if (amountPayingValuesStr) {
          const amountPayingValues = JSON.parse(amountPayingValuesStr);
          
          // Get both planId and currentSIPId
          const planId = sessionStorage.getItem("planId");
          const currentSIPId = sessionStorage.getItem("currentSIPId");
          
          // Use currentSIPId if available, otherwise use planId
          const sipIdToUse = currentSIPId || planId;
          
          if (sipIdToUse && amountPayingValues[sipIdToUse]) {
            const amountStr = amountPayingValues[sipIdToUse].replace(/[^0-9.]/g, "");
            setAmount(amountStr);
            setSipId(sipIdToUse);
          }
        }

        const storedSipType = sessionStorage.getItem("sipType");
        if (storedSipType) {
          setSipType(storedSipType.toUpperCase().trim());
        }
      } catch (error) {
        console.error("Session storage error:", error);
        setIsQuickBuy(false);
      }
    };

    checkQuickBuy();
  }, []);

  /* ---------------- TRANSACTION SUBMIT ---------------- */
  const handleTransactionSubmit = async () => {
    const numericAmount = parseFloat(amount) || 0;

    if (!numericAmount || !sipType) {
      setMessage("Please check amount and SIP type");
      return;
    }

    setLoading(true);
    setMessage("");
    setApiResponse("");

    try {
      const transactionData = {
        amount: numericAmount,
        sip_type: sipType,
        sip_id: sipId,
        utr_no: utrNo.trim() || null,
        transaction_type: "OFFLINE",
        category: "CREDIT",
        shop: shop !== "Select Shop" ? shop : null,
        // Add quick buy specific fields
        ...(isQuickBuy && {
          metal_type: metalType,
          grams: parseFloat(grams) || 0,
          transaction_origin: "quick_buy"
        })
      };

      console.log("Sending transaction data:", transactionData);

      const response = await fetch(
        "http://localhost:5000/api/transactions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              sessionStorage.getItem("authToken") || ""
            }`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      const result = await response.json();
      console.log("Transaction Response:", result);
      setApiResponse(JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Transaction failed");
      }

      // Check if transaction was created successfully
      const transactionCreated = 
        result.success || 
        result.message?.toLowerCase().includes("created") ||
        result.NewTransaction ||
        result.transaction ||
        result.data;

      if (transactionCreated) {
        // Move to OTP verification step
        setStep(2);
        
        // Show appropriate message
        if (isQuickBuy) {
          setMessage("✅ Quick buy transaction created successfully! Please ask admin for OTP.");
        } else {
          setMessage("✅ Transaction created successfully! Please ask admin for OTP.");
        }
      } else {
        setMessage("Transaction creation failed. Please try again.");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- OTP VERIFICATION ---------------- */
  const handleVerifyOTP = async () => {
    if (!sipId || !otp.trim()) {
      setMessage("Please enter OTP");
      return;
    }

    setLoading(true);
    setMessage("");
    setApiResponse("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions/verify-offline",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              sessionStorage.getItem("authToken") || ""
            }`,
          },
          body: JSON.stringify({ 
            sip_id: sipId, 
            otp: otp.trim(),
            // Add quick buy flag for backend if needed
            ...(isQuickBuy && { transaction_origin: "quick_buy" })
          }),
        }
      );

      const result = await response.json();
      setApiResponse(JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "OTP verification failed");
      }

      const successCheck =
        result.success ||
        result.status === "success" ||
        (result.message || "").toLowerCase().includes("verified");

      if (successCheck) {
        setSuccess(true);
        
        // Clear quick buy specific session storage
        if (isQuickBuy) {
          sessionStorage.removeItem("paymentParameters");
          sessionStorage.removeItem("offlinePaymentData");
          sessionStorage.removeItem("razorpayData");
        }
        
        if (isQuickBuy) {
          setMessage("✅ Quick buy OTP verified successfully! Redirecting to Home...");
          setTimeout(() => router.push("/Home"), 2000);
        } else {
          setMessage("✅ OTP verified successfully! Redirecting to SIP page...");
          setTimeout(() => router.push("/savings_plan"), 2000);
        }
      } else {
        setMessage(result.message || "OTP verification failed");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setOtp("");
    setMessage("");
    setApiResponse("");
  };

  const handleNewTransaction = () => {
    // Clear all relevant session storage
    if (isQuickBuy) {
      sessionStorage.removeItem("paymentParameters");
      sessionStorage.removeItem("offlinePaymentData");
    }
    handleReset();
  };

  const debugSessionStorage = () => {
    console.log("=== SESSION STORAGE ===");
    console.log("Is Quick Buy:", isQuickBuy);
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      console.log(key, sessionStorage.getItem(key));
    }
  };

  /* ---------------- UI UPDATES ---------------- */
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center border border-[#50C2C9]">
        <h1 className="text-xl font-bold mb-4 text-[#50C2C9]">
          {isQuickBuy ? "Quick Buy - Offline Payment" : "Offline Payment"}
        </h1>
        
        {/* Debug button */}
        <button 
          onClick={debugSessionStorage}
          className="mb-4 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Debug Session Storage
        </button>

        {success ? (
          <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
            <h2 className="text-lg font-semibold text-green-700">✅ Payment Successful!</h2>
            <p className="text-green-600 mt-2">
              {isQuickBuy ? "Quick buy OTP verified. Redirecting..." : "OTP verified. Redirecting..."}
            </p>
          </div>
        ) : step === 1 ? (
          // Step 1: Transaction Form
          <>
            <div className="space-y-4">
              {/* Quick Buy Banner */}
              {isQuickBuy && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-medium text-blue-700">Quick Buy Transaction</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Data auto-filled from your quick buy selection
                  </p>
                </div>
              )}

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="text"
                  value={amount ? `₹${amount}` : ''}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {amount ? `Amount: ₹${amount}` : 'Amount not found'}
                </p>
              </div>

              {/* Show metal details for quick buy */}
              {isQuickBuy && metalName && (
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metal Details</label>
                  <div className="p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Metal:</span> {metalName}
                      {metalType && ` (${metalType})`}
                    </p>
                    {grams && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Grams:</span> {grams}g
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">SIP Type</label>
                <input
                  type="text"
                  value={sipType}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 capitalize"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {sipType ? `SIP Type: ${sipType}` : 'SIP type not found'}
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isQuickBuy ? "Transaction ID" : "SIP ID"}
                </label>
                <input
                  type="text"
                  value={sipId}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {sipId ? `${isQuickBuy ? 'Transaction' : 'SIP'} ID: ${sipId}` : 'ID not found'}
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number (Optional)</label>
                <input
                  type="text"
                  value={utrNo}
                  onChange={(e) => setUtrNo(e.target.value)}
                  placeholder="Enter UTR if available"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Shop</label>
                <select
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option>Select Shop</option>
                  <option>abc_jewelers</option>
                  <option>xyz_jewelers</option>
                  <option>premium_jewels</option>
                </select>
              </div>

              <div className={`p-3 rounded-lg border ${isQuickBuy ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-800">OFFLINE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-800">CREDIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isQuickBuy ? 'Transaction' : 'SIP'} ID:</span>
                    <span className="font-medium text-gray-800">{sipId || "Not found"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-800">₹{amount || "0"}</span>
                  </div>
                  {isQuickBuy && metalName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metal:</span>
                      <span className="font-medium text-gray-800">{metalName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleTransactionSubmit}
              disabled={loading || !amount || !sipType || !sipId}
              className="w-full bg-[#50C2C9] text-white py-2 rounded-lg mt-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Transaction"}
            </button>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes("Error") ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-blue-600"}`}>
                  {message}
                </p>
              </div>
            )}
          </>
        ) : (
          // Step 2: OTP Verification
          <>
            <div className="space-y-4">
              <div className={`p-3 rounded-lg border ${isQuickBuy ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Transaction Details</h3>
                {isQuickBuy && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">⚡</span>
                    <span className="font-medium text-blue-700 text-sm">Quick Buy</span>
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isQuickBuy ? 'Quick Buy ID:' : 'SIP ID:'}</span>
                    <span className="text-gray-800">{sipId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="text-gray-800">₹{amount}</span>
                  </div>
                  {isQuickBuy && metalName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metal:</span>
                      <span className="text-gray-800">{metalName}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  Ask admin for OTP and enter it below
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full border border-gray-300 rounded-lg p-2 text-center text-lg tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the OTP provided by admin
                </p>
              </div>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || !otp || otp.length < 4}
              className="w-full bg-[#50C2C9] text-white py-2 rounded-lg mt-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleNewTransaction}
                className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                New Transaction
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes("Error") ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-blue-600"}`}>
                  {message}
                </p>
              </div>
            )}
          </>
        )}

        {/* API Response Display */}
        {apiResponse && (
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">API Response:</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}