import { useEffect, useState } from 'react';

function FakeVNPay() {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setOrderId(params.get('orderId'));
    setAmount(params.get('amount'));
  }, []);

  const handleSuccess = () => {
    window.location.href =
      `http://localhost:5000/api/payment/vnpay-return` +
      `?vnp_TxnRef=${orderId}` +
      `&vnp_ResponseCode=00` +
      `&vnp_Amount=${amount * 100}`;
  };

  const handleFail = () => {
    window.location.href =
      `http://localhost:5000/api/payment/vnpay-return` +
      `?vnp_TxnRef=${orderId}` +
      `&vnp_ResponseCode=01`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1>Fake VNPay Gateway</h1>
      <p>Amount: {amount} VND</p>

      <button onClick={handleSuccess}>
        ✅ Pay Success
      </button>

      <button onClick={handleFail} style={{ marginLeft: 10 }}>
        ❌ Fail
      </button>
    </div>
  );
}

export default FakeVNPay;