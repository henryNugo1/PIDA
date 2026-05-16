export const fetchCredits = async (userId: string) => {
  const res = await fetch("http://YOUR_SERVER_URL/get-credits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  return res.json();
};