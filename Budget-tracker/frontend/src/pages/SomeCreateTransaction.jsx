const onCreateTransaction = async (payload) => {
  await api.post('/transactions', payload); // existing create call
  const { notifications } = await getNotifications();
  setNotifications(notifications || []);
};