'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Leaf, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  ChevronRight,
  Shield,
  Clock,
  LogIn,
  UserPlus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/lib/cart-store'

type CheckoutStep = 'contact' | 'shipping' | 'payment'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact')
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    // Contact
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Shipping
    city: '',
    address: '',
    postOffice: '',
    deliveryMethod: 'nova-poshta',
    // Payment
    paymentMethod: 'card-on-delivery',
    comment: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const totalPrice = getTotalPrice()
  const deliveryPrice = totalPrice >= 2000 ? 0 : 150
  const finalTotal = totalPrice + deliveryPrice

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-4">
              Кошик порожній
            </h1>
            <p className="text-muted-foreground mb-8">
              Додайте рослини до кошика, щоб оформити замовлення
            </p>
            <Button asChild size="lg">
              <Link href="/catalog">Перейти до каталогу</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Guest/Login selection screen
  if (isGuest === null) {
    return (
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">
                Зелені Янголи
              </span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 lg:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Оформлення замовлення
              </h1>
              <p className="text-muted-foreground text-lg">
                Оберіть зручний спосіб оформлення
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Login Option */}
              <div className="bg-background rounded-xl border-2 border-primary p-6 lg:p-8 relative">
                <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Рекомендовано
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <LogIn className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      Увійти в акаунт
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Вже маєте акаунт?
                    </p>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3 text-primary" />
                    </div>
                    Швидке оформлення зі збереженими даними
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3 text-primary" />
                    </div>
                    Відстеження статусу замовлення
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3 text-primary" />
                    </div>
                    Історія всіх замовлень
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3 text-primary" />
                    </div>
                    Персональні знижки та акції
                  </li>
                </ul>

                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login?redirect=/checkout">
                    Увійти
                  </Link>
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Немає акаунту?{' '}
                  <Link href="/auth/register?redirect=/checkout" className="text-primary hover:underline font-medium">
                    Зареєструватися
                  </Link>
                </p>
              </div>

              {/* Guest Option */}
              <div className="bg-background rounded-xl border p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <UserPlus className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      Оформити як гість
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Без реєстрації
                    </p>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    Швидке оформлення без реєстрації
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    Підтвердження на email та SMS
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    Можливість зареєструватися пізніше
                  </li>
                </ul>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={() => setIsGuest(true)}
                >
                  Продовжити як гість
                </Button>
              </div>
            </div>

            {/* Order Summary Mini */}
            <div className="mt-8 bg-background rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {items.slice(0, 3).map((item, index) => (
                      <div 
                        key={item.plant.id}
                        className="w-12 h-12 rounded-lg border-2 border-background overflow-hidden bg-muted"
                        style={{ zIndex: 3 - index }}
                      >
                        <Image
                          src={item.plant.images[0]}
                          alt={item.plant.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="w-12 h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                        +{items.length - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {items.length} {items.length === 1 ? 'товар' : items.length < 5 ? 'товари' : 'товарів'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      у вашому кошику
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Загалом</p>
                  <p className="text-xl font-bold text-primary">{totalPrice.toLocaleString()} грн</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate order number
    const orderNumber = `ZY-${Date.now().toString().slice(-8)}`
    
    // Clear cart and redirect to success
    clearCart()
    router.push(`/checkout/success?order=${orderNumber}`)
  }

  const steps: { key: CheckoutStep; label: string; icon: React.ReactNode }[] = [
    { key: 'contact', label: 'Контакти', icon: <User className="h-4 w-4" /> },
    { key: 'shipping', label: 'Доставка', icon: <Truck className="h-4 w-4" /> },
    { key: 'payment', label: 'Оплата', icon: <CreditCard className="h-4 w-4" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  const canProceedToShipping = formData.firstName && formData.lastName && formData.email && formData.phone
  const canProceedToPayment = canProceedToShipping && formData.city && (formData.address || formData.postOffice)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">
                Зелені Янголи
              </span>
            </Link>
            
            <Button variant="ghost" size="sm" onClick={() => setIsGuest(null)}>
              <X className="h-4 w-4 mr-2" />
              Скасувати
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => {
                    if (index < currentStepIndex) {
                      setCurrentStep(step.key)
                    }
                  }}
                  disabled={index > currentStepIndex}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStepIndex
                      ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {step.icon}
                  <span className="font-medium hidden sm:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Step */}
                {currentStep === 'contact' && (
                  <div className="bg-background rounded-xl border p-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Контактні дані
                    </h2>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Ім&apos;я *</Label>
                        <Input
                          id="firstName"
                          placeholder="Введіть ім'я"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Прізвище *</Label>
                        <Input
                          id="lastName"
                          placeholder="Введіть прізвище"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="ваш@email.com"
                            className="pl-10"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Телефон *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+380 XX XXX XX XX"
                            className="pl-10"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep('shipping')}
                        disabled={!canProceedToShipping}
                      >
                        Далі: Доставка
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Shipping Step */}
                {currentStep === 'shipping' && (
                  <div className="bg-background rounded-xl border p-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Доставка
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium mb-4 block">Спосіб доставки</Label>
                        <RadioGroup
                          value={formData.deliveryMethod}
                          onValueChange={(value) => setFormData({ ...formData, deliveryMethod: value })}
                          className="space-y-3"
                        >
                          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.deliveryMethod === 'nova-poshta' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="nova-poshta" id="nova-poshta" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Нова Пошта</p>
                              <p className="text-sm text-muted-foreground">Доставка 1-3 дні</p>
                            </div>
                            <p className="font-medium text-foreground">
                              {totalPrice >= 2000 ? 'Безкоштовно' : '150 грн'}
                            </p>
                          </label>
                          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.deliveryMethod === 'ukrposhta' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="ukrposhta" id="ukrposhta" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Укрпошта</p>
                              <p className="text-sm text-muted-foreground">Доставка 3-7 днів</p>
                            </div>
                            <p className="font-medium text-foreground">
                              {totalPrice >= 2000 ? 'Безкоштовно' : '100 грн'}
                            </p>
                          </label>
                          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="pickup" id="pickup" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Самовивіз</p>
                              <p className="text-sm text-muted-foreground">м. Київ, вул. Садова 15</p>
                            </div>
                            <p className="font-medium text-primary">Безкоштовно</p>
                          </label>
                        </RadioGroup>
                      </div>

                      {formData.deliveryMethod !== 'pickup' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Місто *</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="city"
                                placeholder="Введіть місто"
                                className="pl-10"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          
                          {formData.deliveryMethod === 'nova-poshta' ? (
                            <div className="space-y-2">
                              <Label htmlFor="postOffice">Відділення Нової Пошти *</Label>
                              <Input
                                id="postOffice"
                                placeholder="Номер або адреса відділення"
                                value={formData.postOffice}
                                onChange={(e) => setFormData({ ...formData, postOffice: e.target.value })}
                                required
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="address">Адреса *</Label>
                              <Input
                                id="address"
                                placeholder="Вулиця, будинок, квартира"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setCurrentStep('contact')}
                      >
                        Назад
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep('payment')}
                        disabled={formData.deliveryMethod !== 'pickup' && !canProceedToPayment}
                      >
                        Далі: Оплата
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Step */}
                {currentStep === 'payment' && (
                  <div className="bg-background rounded-xl border p-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Оплата
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium mb-4 block">Спосіб оплати</Label>
                        <RadioGroup
                          value={formData.paymentMethod}
                          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                          className="space-y-3"
                        >
                          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.paymentMethod === 'card-on-delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="card-on-delivery" id="card-on-delivery" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Оплата при отриманні</p>
                              <p className="text-sm text-muted-foreground">Карткою або готівкою</p>
                            </div>
                          </label>
                          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.paymentMethod === 'card-online' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="card-online" id="card-online" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Оплата онлайн</p>
                              <p className="text-sm text-muted-foreground">Visa, Mastercard, Apple Pay, Google Pay</p>
                            </div>
                          </label>
                          <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Банківський переказ</p>
                              <p className="text-sm text-muted-foreground">Для юридичних осіб</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comment">Коментар до замовлення</Label>
                        <Textarea
                          id="comment"
                          placeholder="Додаткова інформація щодо замовлення..."
                          rows={3}
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Security badges */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Безпечна оплата</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Обробка 1-2 години</span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setCurrentStep('shipping')}
                      >
                        Назад
                      </Button>
                      <Button 
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                        className="min-w-[200px]"
                      >
                        {isLoading ? 'Оформлення...' : `Оформити замовлення`}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-background rounded-xl border p-6 sticky top-24">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                  Ваше замовлення
                </h3>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.plant.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.plant.images[0]}
                          alt={item.plant.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {item.plant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {item.plant.price.toLocaleString()} грн
                        </p>
                      </div>
                      <p className="font-medium text-foreground text-sm">
                        {(item.plant.price * item.quantity).toLocaleString()} грн
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товари ({items.length})</span>
                    <span className="text-foreground">{totalPrice.toLocaleString()} грн</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className="text-foreground">
                      {formData.deliveryMethod === 'pickup' || deliveryPrice === 0 
                        ? 'Безкоштовно' 
                        : `${deliveryPrice} грн`}
                    </span>
                  </div>
                  {totalPrice < 2000 && formData.deliveryMethod !== 'pickup' && (
                    <p className="text-xs text-primary">
                      Безкоштовна доставка від 2000 грн
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Всього</span>
                  <span className="text-xl font-bold text-primary">
                    {(formData.deliveryMethod === 'pickup' ? totalPrice : finalTotal).toLocaleString()} грн
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
