import { useEffect, useState } from 'react';

function FakeBank() {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get('orderId'));
    setAmount(params.get('amount'));
  }, []);

  const handleConfirm = () => {
    window.location.href =
      `${window.location.origin}/api/payment/vnpay-return` +
      `?vnp_TxnRef=${orderId}` +
      `&vnp_ResponseCode=00` +
      `&type=qr`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 80 }}>
      <h1>🏦 Fake Bank App</h1>

      <p>Transfer to: 123456789 (Vietcombank)</p>
      <p>Amount: {amount} VND</p>
      <p>Content: {orderId}</p>

      <button onClick={handleConfirm} style={{ marginTop: 20 }}>
        ✅ Confirm Payment
      </button>
    </div>
  );
}

export default FakeBank;