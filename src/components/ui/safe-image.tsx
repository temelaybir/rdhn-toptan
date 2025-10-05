'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import imageLoader from '@/lib/image-loader'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  sizes,
  priority = false,
  placeholder,
  blurDataURL,
  quality = 85,
  ...props
}: SafeImageProps) {
  // Basit URL kontrolü
  const isValidSrc = src && typeof src === 'string' && src.trim() !== ''

  // Geçersiz src için placeholder
  if (!isValidSrc) {
    if (fill) {
      return (
        <div className={cn('bg-gray-100 flex items-center justify-center', className)}>
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    return (
      <div 
        className={cn('bg-gray-100 flex items-center justify-center', className)}
        style={{ width: width || 400, height: height || 400 }}
      >
        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  // Fill mode
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        loader={imageLoader}
        className={cn('object-cover', className)}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={quality}
        {...props}
      />
    )
  }

  // Fixed width/height mode
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 400}
      loader={imageLoader}
      className={cn('max-w-full h-auto', className)}
      sizes={sizes}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      quality={quality}
      {...props}
    />
  )
} 