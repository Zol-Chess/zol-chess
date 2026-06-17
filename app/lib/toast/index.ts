import { toast, ToasterProps } from "sonner";

export const showToast = (
  message: string,
  type: "success" | "error" | "warning" = "error"
) => {
  const options: Partial<ToasterProps> = {
    position: "top-center",
    duration: 5000,
    // icon: getToastIcon(type),
    closeButton: true,
  };

  if (type === "success") {
    toast.success(message, options);
  } else if (type === "error") {
    toast.error(message, options);
  } else if (type == "warning") {
    toast.warning(message, options);
  }
};
