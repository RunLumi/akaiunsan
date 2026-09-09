import { cn } from '@/lib/utils'

export function Logo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      id='akaiunsan-logo'
      src='/images/akaiunsan-logo.png'
      alt='Akaiunsan'
      className={cn('size-6 object-contain', className)}
      {...props}
    />
  )
}
