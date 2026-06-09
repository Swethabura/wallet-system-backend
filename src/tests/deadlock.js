const URL = "http://localhost:5001/api/wallets/deadlock";

const fire = async (label, body) => {
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log(label, data);
  } catch (err) {
    console.error(label, err);
  }
};

Promise.all([
  fire("TX-A", {
    fromWalletId: 1,
    toWalletId: 2,
    amount: 100,
  }),
  fire("TX-B", {
    fromWalletId: 2,
    toWalletId: 1,
    amount: 100,
  }),
]);