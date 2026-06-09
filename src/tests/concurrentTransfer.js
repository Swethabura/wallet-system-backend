const URL = "http://localhost:5001/api/wallets/transfer";

const transfer = async (label, body) => {
  const start = Date.now();

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log(`${label} completed in ${Date.now() - start}ms`);

    console.log(data);
  } catch (error) {
    console.error(`${label} failed`, error);
  }
};

Promise.all([
  transfer("TX-1", {
    fromWalletId: 1,
    toWalletId: 2,
    amount: 500,
  }),
  transfer("TX-2", {
    fromWalletId: 1,
    toWalletId: 3,
    amount: 700,
  }),
]);
