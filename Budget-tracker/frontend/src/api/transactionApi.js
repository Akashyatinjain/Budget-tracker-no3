export async function getTransactions(userId) {
  const res = await fetch(`/api/transactions?userId=${userId}`, { credentials: "include" });
  return res.json();
}