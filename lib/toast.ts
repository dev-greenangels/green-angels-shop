import { toast as sonnerToast, type ExternalToast } from 'sonner'

type ToastMessage = Parameters<typeof sonnerToast>[0]
type ToastOptions = ExternalToast | undefined

const centerOptions = (options?: ToastOptions): ExternalToast => ({
  ...(options ?? {}),
  position: 'top-center',
})

const errorOptions = (options?: ToastOptions): ExternalToast => ({
  ...(options ?? {}),
  position: 'bottom-left',
})

export const toast = Object.assign(
  (message: ToastMessage, options?: ToastOptions) =>
    sonnerToast(message, centerOptions(options)),
  {
    success: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.success(message, centerOptions(options)),
    error: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.error(message, errorOptions(options)),
    info: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.info(message, centerOptions(options)),
    warning: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.warning(message, centerOptions(options)),
    message: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.message(message, centerOptions(options)),
    loading: (message: ToastMessage, options?: ToastOptions) =>
      sonnerToast.loading(message, centerOptions(options)),
    custom: (
      renderer: Parameters<typeof sonnerToast.custom>[0],
      options?: ToastOptions,
    ) => sonnerToast.custom(renderer, centerOptions(options)),
    dismiss: sonnerToast.dismiss,
    promise: <ToastData>(
      promise: Promise<ToastData> | (() => Promise<ToastData>),
      options?: Parameters<typeof sonnerToast.promise<ToastData>>[1],
    ) =>
      sonnerToast.promise(promise, {
        ...(options ?? {}),
        position: 'top-center',
      }),
  },
)
