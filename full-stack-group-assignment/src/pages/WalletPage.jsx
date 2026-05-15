import { useEffect, useState } from 'react'
import {
  getWallet,
  depositWallet,
  withdrawWallet,
  subscribeWallet,
  subscribeQR,
  getPaymentHistory
} from '../services/subscriptionService'
import { getUserProfile } from '../services/userProfileService'

function WalletPage({ currentUser, onRequestLogin }) {
  const userId = currentUser?._id

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [wallet, setWallet] = useState(null)
  const [walletAmount, setWalletAmount] = useState('')
  const [transactions, setTransactions] = useState([])
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!userId) {
      if (onRequestLogin) {
        onRequestLogin()
      }
      return
    }

    let active = true

    async function init() {
      setLoading(true)
      try {
        await Promise.all([loadWallet(), loadTransactions(), loadProfile()])
      } catch (err) {
        console.log(err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      active = false
    }
  }, [userId, onRequestLogin])

  async function loadWallet() {
    try {
      const data = await getWallet()
      setWallet(data)
    } catch (err) {
      console.log(err)
    }
  }

  async function loadTransactions() {
    try {
      const data = await getPaymentHistory()
      setTransactions(data)
    } catch (err) {
      console.log(err)
    }
  }

  async function loadProfile() {
    try {
      const data = await getUserProfile(userId)
      setProfile(data)
    } catch (err) {
      console.log(err)
    }
  }

  async function handleDeposit() {
    const amount = Number(walletAmount)

    if (!amount || amount <= 0) {
      alert('Enter valid amount')
      return
    }

    try {
      setSubscriptionLoading(true)

      const res = await depositWallet(amount)

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
      }

    } catch (err) {
      alert(err.message)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  async function handleWithdraw() {
    try {
      setSubscriptionLoading(true)

      await withdrawWallet(Number(walletAmount))

      alert('Withdraw successful')

      setWalletAmount('')

      loadWallet()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  async function handleWalletSubscription() {
    try {
      setSubscriptionLoading(true)

      const res = await subscribeWallet()

      alert('Premium activated')

      loadWallet()
      loadProfile()

    } catch (err) {
      alert(err.message)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  async function handleQRSubscription() {
    try {
      setSubscriptionLoading(true)

      const res = await subscribeQR()

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')

    if (payment === 'success') {
      alert('Payment successful')
      
      // Properly handle async calls with error handling
      Promise.all([
        loadWallet().catch(err => console.error('Failed to load wallet:', err)),
        loadTransactions().catch(err => console.error('Failed to load transactions:', err)),
        loadProfile().catch(err => console.error('Failed to load profile:', err))
      ]).finally(() => {
        // Clear the payment parameter from URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      })
    }

    if (payment === 'failed') {
      alert('Payment failed')
      // Clear the payment parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Wallet & Subscription</h2>

        {message ? <div style={styles.message}>{message}</div> : null}

        {loading ? (
          <p style={styles.note}>Loading...</p>
        ) : (
          <>
            <div style={styles.subscriptionBox}>
              <h2>Wallet</h2>

              <p>
                Current Balance:
                <strong>
                  {' '}
                  {wallet?.balance || 0} VND
                </strong>
              </p>

              <input
                type="number"
                placeholder="Enter amount"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                style={styles.input}
              />

              <div style={styles.actionRow}>
                <button
                  type="button"
                  style={styles.btn}
                  onClick={handleDeposit}
                  disabled={subscriptionLoading}
                >
                  Add Fund
                </button>

                <button
                  type="button"
                  style={styles.btn}
                  onClick={handleWithdraw}
                  disabled={subscriptionLoading}
                >
                  Withdraw
                </button>
              </div>
            </div>

            <div style={styles.subscriptionBox}>
              {!profile?.isPremium ? (
                <>
                  <h2>Unlock Premium</h2>

                  <p>
                    Upgrade for only <strong>100,000 VND/month</strong>
                  </p>

                  <ul>
                    <li>Replay system</li>
                    <li>Custom marker</li>
                    <li>Premium board styles</li>
                    <li>Future premium features</li>
                  </ul>

                  <div style={styles.actionRow}>
                    <button
                      type="button"
                      style={styles.btn}
                      onClick={handleWalletSubscription}
                      disabled={subscriptionLoading}
                    >
                      Subscribe with Wallet
                    </button>

                    <button
                      type="button"
                      style={styles.btn}
                      onClick={handleQRSubscription}
                      disabled={subscriptionLoading}
                    >
                      Subscribe with QR
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>Premium Active</h2>

                  <p>
                    Your premium account is active.
                  </p>

                  <p>
                    Expiry Date: {profile?.premiumExpiryDate ? new Date(profile.premiumExpiryDate).toLocaleDateString() : 'N/A'}
                  </p>
                </>
              )}
            </div>

            <div style={styles.divider} />

            <h3 style={styles.subTitle}>Transaction History</h3>

            <div style={styles.transactionList}>
              {transactions.map((item) => (
                <div key={item._id} style={styles.transactionCard}>
                  <div>
                    <strong>Description:</strong> {item.description}
                  </div>

                  <div>
                    <strong>Method:</strong> {item.method}
                  </div>

                  <div>
                    <strong>Status:</strong> {item.status}
                  </div>

                  <div>
                    <strong>Amount:</strong> {item.amount} VND
                  </div>

                  <div>
                    <strong>Date:</strong>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>

                  {item.status === 'PENDING' && (
                    <button
                      style={styles.btn}
                      onClick={() => {
                        window.location.href = item.paymentUrl
                      }}
                    >
                      Continue Payment
                    </button>)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    background: '#ffffff',
    border: '2px solid #7c7c7c',
    borderRadius: '8px',
    padding: '20px',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  message: {
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ff6b6b',
    background: '#ffe6e6',
    color: '#d63031',
    borderRadius: '4px',
  },
  note: {
    color: '#636e72',
    fontStyle: 'italic',
  },
  subscriptionBox: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    background: '#f9f9f9',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  btn: {
    padding: '8px 16px',
    background: '#0984e3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  divider: {
    height: '2px',
    background: '#7c7c7c',
    margin: '20px 0',
  },
  subTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  transactionCard: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
    background: '#f9f9f9',
  },
}

export default WalletPage