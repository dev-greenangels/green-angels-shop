'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { categories, containerSizes, sunRequirements, soilTypes, hardinessZones } from '@/lib/data'

export default function AddPlantPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    latinName: '',
    category: '',
    price: '',
    originalPrice: '',
    sku: '',
    description: '',
    shortDescription: '',
    stock: '',
    containerSize: '',
    height: '',
    sunRequirement: '',
    soilType: '',
    hardinessZone: '',
    wateringNeeds: '',
    plantingInstructions: '',
    lightRequirements: '',
    careInstructions: '',
    isNew: false,
    isFeatured: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real app, this would submit to API
    console.log('Plant data:', formData)
    
    router.push('/admin/inventory')
    setIsLoading(false)
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Додати рослину
            </h1>
            <p className="text-muted-foreground">
              Заповніть форму для додавання нової рослини до каталогу
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Збереження...' : 'Зберегти'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основна інформація</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Назва рослини *</Label>
                    <Input
                      id="name"
                      placeholder="Туя західна Смарагд"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latinName">Латинська назва *</Label>
                    <Input
                      id="latinName"
                      placeholder="Thuja occidentalis Smaragd"
                      value={formData.latinName}
                      onChange={(e) => updateField('latinName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Короткий опис</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Вузька конусоподібна туя з яскраво-зеленою хвоєю"
                    value={formData.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Повний опис</Label>
                  <Textarea
                    id="description"
                    placeholder="Детальний опис рослини..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Характеристики</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категорія *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => updateField('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть категорію" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.slug} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="containerSize">Розмір контейнера *</Label>
                    <Select
                      value={formData.containerSize}
                      onValueChange={(value) => updateField('containerSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть розмір" />
                      </SelectTrigger>
                      <SelectContent>
                        {containerSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sunRequirement">Освітлення *</Label>
                    <Select
                      value={formData.sunRequirement}
                      onValueChange={(value) => updateField('sunRequirement', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть" />
                      </SelectTrigger>
                      <SelectContent>
                        {sunRequirements.map((sun) => (
                          <SelectItem key={sun.value} value={sun.value}>
                            {sun.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soilType">Тип ґрунту *</Label>
                    <Select
                      value={formData.soilType}
                      onValueChange={(value) => updateField('soilType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть" />
                      </SelectTrigger>
                      <SelectContent>
                        {soilTypes.map((soil) => (
                          <SelectItem key={soil.value} value={soil.value}>
                            {soil.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hardinessZone">Зона морозостійкості</Label>
                    <Select
                      value={formData.hardinessZone}
                      onValueChange={(value) => updateField('hardinessZone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть" />
                      </SelectTrigger>
                      <SelectContent>
                        {hardinessZones.map((zone) => (
                          <SelectItem key={zone.value} value={zone.value}>
                            {zone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wateringNeeds">Потреби у воді</Label>
                    <Select
                      value={formData.wateringNeeds}
                      onValueChange={(value) => updateField('wateringNeeds', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низькі</SelectItem>
                        <SelectItem value="moderate">Помірні</SelectItem>
                        <SelectItem value="high">Високі</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Висота</Label>
                    <Input
                      id="height"
                      placeholder="80-100 см"
                      value={formData.height}
                      onChange={(e) => updateField('height', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Інструкції з догляду</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plantingInstructions">Інструкції з посадки</Label>
                  <Textarea
                    id="plantingInstructions"
                    placeholder="Опишіть як правильно садити рослину..."
                    rows={3}
                    value={formData.plantingInstructions}
                    onChange={(e) => updateField('plantingInstructions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lightRequirements">Вимоги до освітлення</Label>
                  <Textarea
                    id="lightRequirements"
                    placeholder="Опишіть оптимальні умови освітлення..."
                    rows={3}
                    value={formData.lightRequirements}
                    onChange={(e) => updateField('lightRequirements', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="careInstructions">Загальний догляд</Label>
                  <Textarea
                    id="careInstructions"
                    placeholder="Загальні рекомендації з догляду..."
                    rows={3}
                    value={formData.careInstructions}
                    onChange={(e) => updateField('careInstructions', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ціна та наявність</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">Артикул (SKU) *</Label>
                  <Input
                    id="sku"
                    placeholder="TH-SM-C5-001"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Ціна (₴) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="450"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Стара ціна (₴)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    placeholder="520"
                    value={formData.originalPrice}
                    onChange={(e) => updateField('originalPrice', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Залиште порожнім, якщо немає знижки
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Кількість на складі *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="100"
                    value={formData.stock}
                    onChange={(e) => updateField('stock', e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Фото</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Перетягніть фото сюди або
                  </p>
                  <Button type="button" variant="outline" size="sm">
                    Оберіть файли
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG до 5MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Налаштування</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => updateField('isNew', checked as boolean)}
                  />
                  <Label htmlFor="isNew" className="cursor-pointer">
                    Позначити як новинку
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => updateField('isFeatured', checked as boolean)}
                  />
                  <Label htmlFor="isFeatured" className="cursor-pointer">
                    Показувати на головній
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}
