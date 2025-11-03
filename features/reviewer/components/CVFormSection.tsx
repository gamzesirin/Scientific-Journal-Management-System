'use client'

import { useState, useEffect } from 'react'
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
  Edit,
  Eye,
  EyeOff
} from 'lucide-react'

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

interface CVFormSectionProps {
  userId: string
}

export default function CVFormSection({ userId }: CVFormSectionProps) {
  const [profile, setProfile] = useState<ReviewerProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{
    expertise_score: number
    recommendations: string[]
    suggested_improvements: string[]
    analysis_summary: string
  } | null>(null)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    research_areas: [] as ResearchArea[],
    keywords: [] as string[],
    technical_skills: [] as string[],
    methodologies: [] as string[],
    domains: [] as string[],
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

  // Load existing profile
  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
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
        // No profile exists, start with empty form
        setIsEditing(true)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Hata', 'Profil bilgileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeProfileWithAI = async () => {
    if (formData.research_areas.length === 0) {
      toast.error('Hata', 'En az bir araştırma alanı eklemelisiniz')
      return
    }

    // Check if user is authenticated
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          profileData: formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show more detailed error message if available
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

  const handleSave = async () => {
    // First, analyze with AI if not already analyzed
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
        // gemini_model_version: 'manual-entry', // Commented out until DB migration is applied
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('reviewer_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setIsEditing(false)
      setAiAnalysis(null) // Reset AI analysis after saving
      toast.update(toastId, 'Profil başarıyla kaydedildi!', 'success')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.update(toastId, 'Kaydetme başarısız', 'error')
      toast.error('Hata', error.message || 'Profil kaydedilirken hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset AI analysis when form data changes
  const resetAIAnalysis = () => {
    setAiAnalysis(null)
  }

  // Add functions for different fields
  const addResearchArea = () => {
    if (newResearchArea.area.trim()) {
      setFormData({
        ...formData,
        research_areas: [...formData.research_areas, { ...newResearchArea }]
      })
      setNewResearchArea({ area: '', weight: 0.5 })
      resetAIAnalysis()
    }
  }

  const removeResearchArea = (index: number) => {
    setFormData({
      ...formData,
      research_areas: formData.research_areas.filter((_, i) => i !== index)
    })
    resetAIAnalysis()
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, newKeyword.trim()]
      })
      setNewKeyword('')
      resetAIAnalysis()
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    })
    resetAIAnalysis()
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.technical_skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        technical_skills: [...formData.technical_skills, newSkill.trim()]
      })
      setNewSkill('')
      resetAIAnalysis()
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      technical_skills: formData.technical_skills.filter(s => s !== skill)
    })
    resetAIAnalysis()
  }

  const addMethodology = () => {
    if (newMethodology.trim() && !formData.methodologies.includes(newMethodology.trim())) {
      setFormData({
        ...formData,
        methodologies: [...formData.methodologies, newMethodology.trim()]
      })
      setNewMethodology('')
      resetAIAnalysis()
    }
  }

  const removeMethodology = (methodology: string) => {
    setFormData({
      ...formData,
      methodologies: formData.methodologies.filter(m => m !== methodology)
    })
    resetAIAnalysis()
  }

  const addDomain = () => {
    if (newDomain.trim() && !formData.domains.includes(newDomain.trim())) {
      setFormData({
        ...formData,
        domains: [...formData.domains, newDomain.trim()]
      })
      setNewDomain('')
      resetAIAnalysis()
    }
  }

  const removeDomain = (domain: string) => {
    setFormData({
      ...formData,
      domains: formData.domains.filter(d => d !== domain)
    })
    resetAIAnalysis()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="animate-spin h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full" />
            <span>Profil yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // View Mode
  if (!isEditing && profile) {
    return (
      <div className="space-y-6">
        {/* Profile Summary Card */}
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
              <Button onClick={() => setIsEditing(true)} variant="outline">
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
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span>Yayınlar</span>
                </div>
                <p className="text-xl font-bold mt-1">{profile.publications_count}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Award className="h-4 w-4" />
                  <span>H-Index</span>
                </div>
                <p className="text-xl font-bold mt-1">{profile.h_index}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Deneyim</span>
                </div>
                <p className="text-xl font-bold mt-1">{profile.years_of_experience} yıl</p>
              </div>
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
                onChange={(e) => setNewResearchArea({ ...newResearchArea, area: e.target.value })}
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
                onChange={(e) => setNewResearchArea({ ...newResearchArea, weight: parseFloat(e.target.value) || 0 })}
              />
              <Button onClick={addResearchArea} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.research_areas.map((area, idx) => (
                <Badge key={idx} variant="default" className="gap-1 py-1">
                  {area.area} ({Math.round(area.weight * 100)}%)
                  <button
                    onClick={() => removeResearchArea(idx)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Anahtar Kelimeler</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: Derin Öğrenme"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <Button onClick={addKeyword} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1 py-1">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Academic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publications">Yayın Sayısı</Label>
              <Input
                id="publications"
                type="number"
                min="0"
                value={formData.publications_count}
                onChange={(e) => {
                  setFormData({ ...formData, publications_count: parseInt(e.target.value) || 0 })
                  resetAIAnalysis()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-index">H-Index</Label>
              <Input
                id="h-index"
                type="number"
                min="0"
                value={formData.h_index}
                onChange={(e) => {
                  setFormData({ ...formData, h_index: parseInt(e.target.value) || 0 })
                  resetAIAnalysis()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Deneyim (Yıl)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.years_of_experience}
                onChange={(e) => {
                  setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })
                  resetAIAnalysis()
                }}
              />
            </div>
          </div>

          {/* Technical Skills */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Teknik Yetenekler</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: Python, R, SPSS"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.technical_skills.map((skill) => (
                <Badge key={skill} variant="outline" className="gap-1 py-1 border-blue-300 text-blue-700">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Methodologies */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Araştırma Metodolojileri</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: Deneysel, Nitel, Nicel"
                value={newMethodology}
                onChange={(e) => setNewMethodology(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMethodology()}
              />
              <Button onClick={addMethodology} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.methodologies.map((method) => (
                <Badge key={method} variant="outline" className="gap-1 py-1 border-purple-300 text-purple-700">
                  {method}
                  <button
                    onClick={() => removeMethodology(method)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Alan/Domainler</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: Bilgisayar Bilimleri, Mühendislik"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
              />
              <Button onClick={addDomain} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.domains.map((domain) => (
                <Badge key={domain} variant="outline" className="gap-1 py-1">
                  {domain}
                  <button
                    onClick={() => removeDomain(domain)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Profil Özeti</Label>
            <Textarea
              id="summary"
              placeholder="Kendinizi ve uzmanlık alanlarınızı kısaca tanıtın..."
              rows={4}
              value={formData.cv_analysis_summary}
              onChange={(e) => {
                setFormData({ ...formData, cv_analysis_summary: e.target.value })
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

            {aiAnalysis && (
              <div className="space-y-4">
                {/* AI Score Display */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-900">AI Uzmanlık Skoru:</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{aiAnalysis.expertise_score}/100</span>
                  </div>
                </div>

                {/* AI Summary */}
                {aiAnalysis.analysis_summary && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2">AI Analiz Özeti</h4>
                    <p className="text-sm text-gray-700">{aiAnalysis.analysis_summary}</p>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-sm text-green-900 mb-2">AI Önerileri</h4>
                    <ul className="space-y-1">
                      {aiAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Improvements */}
                {aiAnalysis.suggested_improvements && aiAnalysis.suggested_improvements.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-sm text-yellow-900 mb-2">Geliştirme Önerileri</h4>
                    <ul className="space-y-1">
                      {aiAnalysis.suggested_improvements.map((imp, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">💡</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setAiAnalysis(null)
                  fetchProfile() // Reset to original data
                }}
                variant="outline"
              >
                İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}