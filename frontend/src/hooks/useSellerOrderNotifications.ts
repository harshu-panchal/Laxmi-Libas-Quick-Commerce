/* @refresh reset */
/**
 * @deprecated Use SellerNotificationProvider + useSellerNotifications from context.
 * Re-export for backward compatibility.
 */
export {
  dispatchSellerNewOrderEvent,
  useSellerNotifications as useSellerOrderNotifications,
} from '../context/SellerNotificationContext';
