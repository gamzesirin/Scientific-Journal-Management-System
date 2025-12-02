'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import {
  Save,
  FileText,
  Sparkles,
  Award,
  BookOpen,
  Code,
  FlaskConical,
  Calendar,
  Plus,
  X,
  Edit
} from 'lucide-react'

// Types
interface ResearchArea {
  area: string
  weight: number
}

interface ReviewerProfile {
  id?: string
  user_id: string
  research_areas: ResearchArea[]
  keywords: string[]
  technical_skills: string[]
  methodologies: string[]
  domains: string[]
  publications_count: number
  h_index: number
  years_of_experience: number
  expertise_score: number
  cv_analysis_summary: string
  last_analysis_date: string
}

interface AIAnalysis {
  expertise_score: number
  recommendations: string[]
  suggested_improvements: string[]
  analysis_summary: string
}

interface FormData {
  research_areas: ResearchArea[]
  keywords: string[]
  technical_skills: string[]
  methodologies: string[]
  domains: string[]
  publications_count: number
  h_index: number
  years_of_experience: number
  cv_analysis_summary: string
}

interface CVFormSectionProps {
  userId: string
}

// Tag Input Component - Reusable for keywords, skills, methodologies, domains
interface TagInputFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onAdd: () => void
  tags: string[]
  onRemove: (tag: string) => void
  badgeClassName?: string
  icon?: React.ReactNode
}

function TagInputField({
  label,
  placeholder,
  value,
  onChange,
  onAdd,
  tags,
  onRemove,
  badgeClassName = '',
  icon
}: TagInputFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAdd()}
        />
        <Button onClick={onAdd} size="icon" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="outline" className={`gap-1 py-1 ${badgeClassName}`}>
            {icon}
            {tag}
            <button onClick={() => onRemove(tag)} className="ml-1 hover:text-red-600">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

// Profile View Component
interface ProfileViewProps {
  profile: ReviewerProfile
  onEdit: () => void
}

function ProfileView({ profile, onEdit }: ProfileViewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Hakem Profili
              </CardTitle>
              <CardDescription>
                Son güncelleme: {new Date(profile.last_analysis_date).toLocaleDateString('tr-TR')}
              </CardDescription>
            </div>
            <Button onClick={onEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expertise Score */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Uzmanlık Skoru</p>
                <p className="text-2xl font-bold">{profile.expertise_score}/100</p>
              </div>
            </div>
          </div>

          {/* Research Areas */}
          {profile.research_areas.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Araştırma Alanları</Label>
              <div className="flex flex-wrap gap-2">
                {profile.research_areas.map((area, idx) => (
                  <Badge key={idx} variant="default" className="bg-green-600">
                    {area.area} ({Math.round(area.weight * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {profile.keywords.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Anahtar Kelimeler</Label>
              <div className="flex flex-wrap gap-2">
                {profile.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard icon={<BookOpen className="h-4 w-4" />} label="Yayınlar" value={profile.publications_count} />
            <MetricCard icon={<Award className="h-4 w-4" />} label="H-Index" value={profile.h_index} />
            <MetricCard icon={<Calendar className="h-4 w-4" />} label="Deneyim" value={`${profile.years_of_experience} yıl`} />
          </div>

          {/* Summary */}
          {profile.cv_analysis_summary && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Profil Özeti</Label>
              <p className="text-sm text-gray-700 p-3 bg-white rounded-lg border">
                {profile.cv_analysis_summary}
              </p>
            </div>
          )}

          {/* Technical Skills */}
          {profile.technical_skills.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Teknik Yetenekler</Label>
              <div className="flex flex-wrap gap-2">
                {profile.technical_skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="border-blue-300 text-blue-700">
                    <Code className="h-3 w-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Methodologies */}
          {profile.methodologies.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Metodolojiler</Label>
              <div className="flex flex-wrap gap-2">
                {profile.methodologies.map((method, idx) => (
                  <Badge key={idx} variant="outline" className="border-purple-300 text-purple-700">
                    <FlaskConical className="h-3 w-3 mr-1" />
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-3 bg-white rounded-lg border">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}

// AI Analysis Display Component
function AIAnalysisDisplay({ analysis }: { analysis: AIAnalysis }) {
  return (
    <div className="space-y-4">
      {/* AI Score Display */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-900">AI Uzmanlık Skoru:</span>
          </div>
          <span className="text-2xl font-bold text-purple-600">{analysis.expertise_score}/100</span>
        </div>
      </div>

      {/* AI Summary */}
      {analysis.analysis_summary && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">AI Analiz Özeti</h4>
          <p className="text-sm text-gray-700">{analysis.analysis_summary}</p>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-sm text-green-900 mb-2">AI Önerileri</h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Improvements */}
      {analysis.suggested_improvements?.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-sm text-yellow-900 mb-2">Geliştirme Önerileri</h4>
          <ul className="space-y-1">
            {analysis.suggested_improvements.map((imp, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">💡</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Loading Spinner Component
function LoadingSpinner({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <div className="animate-spin h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full" />
          <span>{message}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function CVFormSection({ userId }: CVFormSectionProps) {
  const [profile, setProfile] = useState<ReviewerProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState<FormData>({
    research_areas: [],
    keywords: [],
    technical_skills: [],
    methodologies: [],
    domains: [],
    publications_count: 0,
    h_index: 0,
    years_of_experience: 0,
    cv_analysis_summary: ''
  })

  // Input states for adding new items
  const [newResearchArea, setNewResearchArea] = useState({ area: '', weight: 0.5 })
  const [newKeyword, setNewKeyword] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newMethodology, setNewMethodology] = useState('')
  const [newDomain, setNewDomain] = useState('')

  const resetAIAnalysis = useCallback(() => setAiAnalysis(null), [])

  // Generic handlers for tag operations
  const createTagHandlers = useCallback((
    field: keyof Pick<FormData, 'keywords' | 'technical_skills' | 'methodologies' | 'domains'>
  ) => ({
    add: (value: string, setValue: (v: string) => void) => {
      const trimmed = value.trim()
      if (trimmed && !formData[field].includes(trimmed)) {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], trimmed] }))
        setValue('')
        resetAIAnalysis()
      }
    },
    remove: (tag: string) => {
      setFormData(prev => ({ ...prev, [field]: prev[field].filter(t => t !== tag) }))
      resetAIAnalysis()
    }
  }), [formData, resetAIAnalysis])

  const keywordHandlers = createTagHandlers('keywords')
  const skillHandlers = createTagHandlers('technical_skills')
  const methodologyHandlers = createTagHandlers('methodologies')
  const domainHandlers = createTagHandlers('domains')

  // Research area handlers (special case with weight)
  const addResearchArea = useCallback(() => {
    if (newResearchArea.area.trim()) {
      setFormData(prev => ({
        ...prev,
        research_areas: [...prev.research_areas, { ...newResearchArea }]
      }))
      setNewResearchArea({ area: '', weight: 0.5 })
      resetAIAnalysis()
    }
  }, [newResearchArea, resetAIAnalysis])

  const removeResearchArea = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      research_areas: prev.research_areas.filter((_, i) => i !== index)
    }))
    resetAIAnalysis()
  }, [resetAIAnalysis])

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviewer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        setProfile(data)
        setFormData({
          research_areas: data.research_areas || [],
          keywords: data.keywords || [],
          technical_skills: data.technical_skills || [],
          methodologies: data.methodologies || [],
          domains: data.domains || [],
          publications_count: data.publications_count || 0,
          h_index: data.h_index || 0,
          years_of_experience: data.years_of_experience || 0,
          cv_analysis_summary: data.cv_analysis_summary || ''
        })
      } else {
        setIsEditing(true)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Hata', 'Profil bilgileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Analyze profile with AI
  const analyzeProfileWithAI = async () => {
    if (formData.research_areas.length === 0) {
      toast.error('Hata', 'En az bir araştırma alanı eklemelisiniz')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Oturum Hatası', 'Lütfen tekrar giriş yapın')
      return
    }

    setIsAnalyzing(true)
    const toastId = toast.loading('AI ile profil analiz ediliyor...')

    try {
      const response = await fetch('/api/reviewer/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profileData: formData }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.hint ? `${data.error}: ${data.hint}` : (data.error || 'Profil analizi başarısız oldu')
        throw new Error(errorMsg)
      }

      setAiAnalysis({
        expertise_score: data.expertise_score,
        recommendations: data.recommendations || [],
        suggested_improvements: data.suggested_improvements || [],
        analysis_summary: data.analysis_summary || '',
      })

      toast.update(toastId, 'AI analizi tamamlandı!', 'success')
    } catch (error: any) {
      console.error('AI analysis error:', error)
      toast.update(toastId, 'AI analizi başarısız', 'error')
      toast.error('Hata', error.message || 'Profil analiz edilirken hata oluştu')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save profile
  const handleSave = async () => {
    if (!aiAnalysis) {
      toast.error('Hata', 'Lütfen önce "AI ile Analiz Et" butonuna tıklayın')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading('Profil kaydediliyor...')

    try {
      const profileData = {
        user_id: userId,
        ...formData,
        expertise_score: aiAnalysis.expertise_score,
        last_analysis_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('reviewer_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setIsEditing(false)
      setAiAnalysis(null)
      toast.update(toastId, 'Profil başarıyla kaydedildi!', 'success')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.update(toastId, 'Kaydetme başarısız', 'error')
      toast.error('Hata', error.message || 'Profil kaydedilirken hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle numeric input change
  const handleNumericChange = (field: keyof Pick<FormData, 'publications_count' | 'h_index' | 'years_of_experience'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
    resetAIAnalysis()
  }

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false)
    setAiAnalysis(null)
    fetchProfile()
  }

  if (isLoading) {
    return <LoadingSpinner message="Profil yükleniyor..." />
  }

  if (!isEditing && profile) {
    return <ProfileView profile={profile} onEdit={() => setIsEditing(true)} />
  }

  // Edit/Create Mode
  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {profile ? 'Hakem Profilini Düzenle' : 'Hakem Profili Oluştur'}
          </CardTitle>
          <CardDescription>
            Uzmanlık alanlarınızı ve akademik bilgilerinizi girerek AI tabanlı makale eşleştirme sistemine dahil olun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Research Areas */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Araştırma Alanları</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: Makine Öğrenmesi"
                value={newResearchArea.area}
                onChange={(e) => setNewResearchArea(prev => ({ ...prev, area: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addResearchArea()}
              />
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                className="w-24"
                placeholder="Ağırlık"
                value={newResearchArea.weight}
                onChange={(e) => setNewResearchArea(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              />
              <Button onClick={addResearchArea} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.research_areas.map((area, idx) => (
                <Badge key={idx} variant="default" className="gap-1 py-1">
                  {area.area} ({Math.round(area.weight * 100)}%)
                  <button onClick={() => removeResearchArea(idx)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <TagInputField
            label="Anahtar Kelimeler"
            placeholder="Örn: Derin Öğrenme"
            value={newKeyword}
            onChange={setNewKeyword}
            onAdd={() => keywordHandlers.add(newKeyword, setNewKeyword)}
            tags={formData.keywords}
            onRemove={keywordHandlers.remove}
          />

          {/* Academic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publications">Yayın Sayısı</Label>
              <Input
                id="publications"
                type="number"
                min="0"
                value={formData.publications_count}
                onChange={(e) => handleNumericChange('publications_count', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-index">H-Index</Label>
              <Input
                id="h-index"
                type="number"
                min="0"
                value={formData.h_index}
                onChange={(e) => handleNumericChange('h_index', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Deneyim (Yıl)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.years_of_experience}
                onChange={(e) => handleNumericChange('years_of_experience', e.target.value)}
              />
            </div>
          </div>

          {/* Technical Skills */}
          <TagInputField
            label="Teknik Yetenekler"
            placeholder="Örn: Python, R, SPSS"
            value={newSkill}
            onChange={setNewSkill}
            onAdd={() => skillHandlers.add(newSkill, setNewSkill)}
            tags={formData.technical_skills}
            onRemove={skillHandlers.remove}
            badgeClassName="border-blue-300 text-blue-700"
          />

          {/* Methodologies */}
          <TagInputField
            label="Araştırma Metodolojileri"
            placeholder="Örn: Deneysel, Nitel, Nicel"
            value={newMethodology}
            onChange={setNewMethodology}
            onAdd={() => methodologyHandlers.add(newMethodology, setNewMethodology)}
            tags={formData.methodologies}
            onRemove={methodologyHandlers.remove}
            badgeClassName="border-purple-300 text-purple-700"
          />

          {/* Domains */}
          <TagInputField
            label="Alan/Domainler"
            placeholder="Örn: Bilgisayar Bilimleri, Mühendislik"
            value={newDomain}
            onChange={setNewDomain}
            onAdd={() => domainHandlers.add(newDomain, setNewDomain)}
            tags={formData.domains}
            onRemove={domainHandlers.remove}
          />

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Profil Özeti</Label>
            <Textarea
              id="summary"
              placeholder="Kendinizi ve uzmanlık alanlarınızı kısaca tanıtın..."
              rows={4}
              value={formData.cv_analysis_summary}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, cv_analysis_summary: e.target.value }))
                resetAIAnalysis()
              }}
            />
          </div>

          {/* AI Analysis Section */}
          <div className="space-y-4">
            <Button
              onClick={analyzeProfileWithAI}
              disabled={isAnalyzing || formData.research_areas.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  AI ile Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI ile Profili Analiz Et
                </>
              )}
            </Button>

            {aiAnalysis && <AIAnalysisDisplay analysis={aiAnalysis} />}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || !aiAnalysis}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Profili Kaydet
                </>
              )}
            </Button>
            {profile && (
              <Button onClick={handleCancel} variant="outline">
                İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
