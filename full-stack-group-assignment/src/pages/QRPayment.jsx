import { useEffect, useState } from 'react';
import { API_ROOT_URL, PUBLIC_APP_URL } from '../config/appConfig';

function QRPayment() {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  // get params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get('orderId'));
    setAmount(params.get('amount'));
  }, []);

  // generate QR
  const qrUrl =
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `${PUBLIC_APP_URL}/fake-bank?orderId=${orderId}&amount=${amount}`
  )}`;

  // auto check payment
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`${API_ROOT_URL}/payment/status?orderId=${orderId}`);
      const data = await res.json();

      if (data.status === 'SUCCESS') {
        clearInterval(interval);
        alert('Payment successful!');
        window.location.href = '/wallet';
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  // countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      alert('Payment expired');
      window.location.href = '/wallet';
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1>Scan QR to Pay</h1>

      <img src={qrUrl} width={300} />

      <p>Amount: {amount} VND</p>
      <p>Time left: {timeLeft}s</p>
    </div>
  );
}

export default QRPayment;