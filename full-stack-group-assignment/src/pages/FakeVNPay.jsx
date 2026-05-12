import { useEffect, useState } from 'react';
import { API_ROOT_URL } from '../config/appConfig';

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
      `${API_ROOT_URL}/payment/vnpay-return` +
      `?vnp_TxnRef=${orderId}` +
      `&vnp_ResponseCode=00` +
      `&vnp_Amount=${amount * 100}` +
      `&type=wallet`;
  };

  const handleFail = () => {
    window.location.href =
      `${API_ROOT_URL}/payment/vnpay-return` +
      `?vnp_TxnRef=${orderId}` +
      `&vnp_ResponseCode=01` +
      `&type=wallet`;
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