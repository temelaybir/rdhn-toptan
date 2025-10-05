import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface PageProps {
  params: {
    slug: string[]
  }
}

interface InternalPage {
  id: string
  slug: string
  title: string
  content: string
  meta_description: string
  meta_keywords: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.slug.join('/')
  
  try {
    const supabase = await createClient()
    const { data: page } = await supabase
      .from('internal_pages')
      .select('title, meta_description, meta_keywords')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!page) {
      return {
        title: 'Sayfa Bulunamadı',
        description: 'Aradığınız sayfa bulunamadı.'
      }
    }

    return {
      title: page.title,
      description: page.meta_description || page.title,
      keywords: page.meta_keywords,
      openGraph: {
        title: page.title,
        description: page.meta_description || page.title,
        type: 'website',
      },
    }
  } catch (error) {
    return {
      title: 'Sayfa Bulunamadı',
      description: 'Aradığınız sayfa bulunamadı.'
    }
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug.join('/')
  
  try {
    const supabase = await createClient()
    const { data: page, error } = await supabase
      .from('internal_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !page) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div 
            className="dynamic-page-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Sayfa yükleme hatası:', error)
    notFound()
  }
}
