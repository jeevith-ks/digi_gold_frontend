"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, AlertCircle, Building, CreditCard, Hash, Ticket, FileText } from 'lucide-react';
import '../home-enhanced.css';

export default function PayofflinePage() {
  const [amount, setAmount] = useState("");
  const [sipType, setSipType] = useState("");
  const [sipId, setSipId] = useState(""); // Add sipId state
  const [utrNo, setUtrNo] = useState("");
  const [otp, setOtp] = useState("");
  const [shop, setShop] = useState("Select Shop");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trId, setTrId] = useState("");
  const [step, setStep] = useState(1);
  const [apiResponse, setApiResponse] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedTrId = sessionStorage.getItem("offline_tr_id");
    if (storedTrId) {
      setTrId(storedTrId);
      setStep(2);
      setMessage("Found existing transaction. Please verify OTP.");
    }

    try {
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
          setSipId(sipIdToUse); // Set sipId state
        }
      }

      const storedSipType = sessionStorage.getItem("sipType");
      if (storedSipType) {
        setSipType(storedSipType.toUpperCase().trim());
      }
    } catch (error) {
      console.error("Session storage error:", error);
    }
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
        sip_id: sipId, // Use the sipId state
        utr_no: utrNo.trim() || null,
        transaction_type: "OFFLINE",
        category: "CREDIT",
        shop: shop !== "Select Shop" ? shop : null,
      };

      console.log("Sending transaction data:", transactionData); // Debug log

      const response = await fetch(
        "http://35.154.85.104:5000/api/transactions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("authToken") || ""
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

      let receivedTrId = "";
      if (result.tr_id) receivedTrId = result.tr_id;
      else if (result.NewTransaction?.tr_id)
        receivedTrId = result.NewTransaction.tr_id;
      else if (result.transaction?.tr_id)
        receivedTrId = result.transaction.tr_id;
      else if (result.data?.tr_id) receivedTrId = result.data.tr_id;

      if (receivedTrId) {
        sessionStorage.setItem("offline_tr_id", receivedTrId);
        setTrId(receivedTrId);
        setStep(2);
        setMessage(
          `✅ Transaction created successfully! Transaction ID: ${receivedTrId}. Please ask admin for OTP.`
        );
      } else {
        setMessage("Transaction created but transaction ID not found.");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- OTP VERIFICATION ---------------- */
  const handleVerifyOTP = async () => {
    if (!trId || !otp.trim()) {
      setMessage("Please enter OTP");
      return;
    }

    setLoading(true);
    setMessage("");
    setApiResponse("");

    try {
      const response = await fetch(
        "http://35.154.85.104:5000/api/transactions/verify-offline",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("authToken") || ""
              }`,
          },
          body: JSON.stringify({ tr_id: trId, otp: otp.trim() }),
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
        setMessage("✅ OTP verified successfully!");
        sessionStorage.removeItem("offline_tr_id");

        setTimeout(() => router.push("/savings_plan"), 2000);
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
    sessionStorage.removeItem("offline_tr_id");
    handleReset();
  };

  const debugSessionStorage = () => {
    console.log("=== SESSION STORAGE ===");
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      console.log(key, sessionStorage.getItem(key));
    }
  };

  /* ---------------- UI UPDATES ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-[#50C2C9] selection:text-white">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 ml-2">Offline Payment</h1>
        </div>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto p-6 pb-24">
        {/* Debug button (Hidden in production styling but kept for functionality) */}
        <div className="flex justify-end mb-4">
          <button
            onClick={debugSessionStorage}
            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            Debug
          </button>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-scale-in border border-green-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-6">Your transaction has been verified successfully.</p>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                <p className="text-lg font-mono font-medium text-gray-900">{trId}</p>
              </div>
              <p className="text-sm text-[#50C2C9] animate-pulse font-medium">Redirecting to home...</p>
            </div>
          </div>
        ) : step === 1 ? (
          // Step 1: Transaction Form
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#50C2C9] to-[#2D8A94]"></div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Details</h2>
              <p className="text-sm text-gray-500">Enter payment information below</p>
            </div>

            <div className="space-y-5">
              {/* Amount Display */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Amount to Pay</label>
                <div className="text-3xl font-bold text-[#50C2C9]">
                  ₹{amount || "0"}
                </div>
              </div>

              {/* SIP Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Ticket className="w-4 h-4 text-[#50C2C9]" />
                    <span className="text-xs font-medium text-gray-500">SIP Type</span>
                  </div>
                  <p className="font-semibold text-gray-900 capitalize truncate">{sipType || "N/A"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Hash className="w-4 h-4 text-[#50C2C9]" />
                    <span className="text-xs font-medium text-gray-500">SIP ID</span>
                  </div>
                  <p className="font-semibold text-gray-900 truncate" title={sipId}>
                    {sipId ? `#${sipId}` : "N/A"}
                  </p>
                </div>
              </div>

              {/* UTR Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                  <CreditCard className="w-4 h-4 text-[#50C2C9]" />
                  <span>UTR Number</span>
                  <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={utrNo}
                  onChange={(e) => setUtrNo(e.target.value)}
                  placeholder="Enter transaction UTR"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Shop Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                  <Building className="w-4 h-4 text-[#50C2C9]" />
                  <span>Select Shop</span>
                </label>
                <div className="relative">
                  <select
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent outline-none transition-all font-medium text-gray-900 appearance-none"
                  >
                    <option disabled>Select Shop</option>
                    <option>abc_jewelers</option>
                    <option>xyz_jewelers</option>
                    <option>premium_jewels</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronLeft className="w-5 h-5 text-gray-400 -rotate-90" />
                  </div>
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <div className={`p-4 rounded-xl flex items-start space-x-3 ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              <button
                onClick={handleTransactionSubmit}
                disabled={loading || !amount || !sipType || !sipId}
                className="w-full py-4 bg-gradient-to-r from-[#50C2C9] to-[#2D8A94] text-white rounded-xl font-bold shadow-lg shadow-[#50C2C9]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit Payment</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Step 2: OTP Verification
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Verify Transaction</h2>
              <p className="text-gray-500 text-sm mt-1">Please enter the OTP provided by the admin</p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-yellow-700">Transaction ID</span>
                <span className="font-mono font-medium text-yellow-900">{trId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-700">Amount</span>
                <span className="font-bold text-yellow-900">₹{amount}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-center text-sm font-medium text-gray-700 mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-center text-3xl tracking-[1em] font-mono font-bold p-4 border-2 border-gray-200 rounded-2xl focus:border-[#50C2C9] focus:ring-4 focus:ring-[#50C2C9]/10 outline-none transition-all text-gray-800 placeholder-gray-300"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl flex items-center justify-center space-x-2 ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || !otp || otp.length < 4}
                className="w-full py-4 bg-gradient-to-r from-[#50C2C9] to-[#2D8A94] text-white rounded-xl font-bold shadow-lg shadow-[#50C2C9]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="py-3 px-4 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNewTransaction}
                  className="py-3 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Response Display (Development Only) */}
        {apiResponse && (
          <div className="mt-8 p-4 bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">API Response Log</h4>
            <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}