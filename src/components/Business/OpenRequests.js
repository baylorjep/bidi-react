import { sendNotification, notificationTypes } from '../../utils/notifications';

// Inside the useEffect where requests are fetched:
useEffect(() => {
  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    setRequests(requests || []);

    // Send notification for new requests
    const newRequests = requests.filter(request => {
      const isNew = !request.notified;
      if (isNew) {
        sendNotification(
          user.id,
          notificationTypes.NEW_REQUEST,
          `New request received: ${request.title}`
        );
      }
      return isNew;
    });

    if (newRequests.length > 0) {
      // Update notified status for new requests
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ notified: true })
        .in('id', newRequests.map(r => r.id));

      if (updateError) {
        console.error('Error updating request notification status:', updateError);
      }
    }
  };

  fetchRequests();
}, []); 