import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, CakeSlice, Check,
  Clock3, Heart, Menu, Minus, PackageCheck, Phone, Plus,
  ShieldCheck, ShoppingBag, Sparkles, Truck, X, LoaderCircle, Pencil, Trash2,
  LogOut, LayoutDashboard, Tags, Megaphone, Settings, ClipboardList,
  Upload, Eye, EyeOff, MessageCircle, CircleAlert, ImagePlus,
} from 'lucide-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const sampleProducts = [
  { id: 'sample-1', name: 'Le Doux Passion', description: 'Génoise moelleuse, crème légère et fruits de la passion.', category: 'Gâteaux signature', price: 18000, promo_price: 15000, available: true, published: true, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85' },
  { id: 'sample-2', name: 'Choco Velours', description: 'Un cœur fondant au chocolat noir, tout en douceur.', category: 'Chocolat', price: 22000, available: true, published: true, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=85' },
  { id: 'sample-3', name: 'Douceur Vanille', description: 'Vanille délicate, fruits rouges et fleurs de saison.', category: 'Gâteaux signature', price: 25000, available: true, published: true, image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1000&q=85' },
  { id: 'sample-4', name: 'Le Petit Nuage', description: 'Un gâteau tout léger, habillé d’une crème délicate.', category: 'Pâtisseries', price: 12000, available: true, published: true, image_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1000&q=85' },
  { id: 'sample-5', name: 'Coco des tropiques', description: 'Noix de coco fraîche, biscuit tendre et notes vanillées.', category: 'Gâteaux signature', price: 20000, available: true, published: true, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1000&q=85' },
  { id: 'sample-6', name: 'Noces fleuries', description: 'Une création élégante pour les jours inoubliables.', category: 'Événements', price: 45000, available: true, published: true, image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85' },
]
const samplePromotions = [{ id: 'sample-promo', title: 'Une petite douceur en plus', description: 'Un gâteau vous fait de l’œil ? Contactez-nous sur WhatsApp pour découvrir les offres du moment.', active: true }]
const defaultSettings = { shop_name: 'Douceurs du Gabon', tagline: 'Des gâteaux faits avec amour', phone: '', whatsapp: '', address: '', delivery_fee: 0, pickup_enabled: true, delivery_enabled: true, airtel_money_phone: '', moov_money_phone: '' }
const formatPrice = (price) => `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`
const getDiscountPrice = (product) => product.promo_price && product.promo_price < product.price ? product.promo_price : product.price
const getCategory = (product) => product.categories?.name || product.category || 'Créations'
const imageFallback = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85'
const publicErrorMessage = 'Cette action nécessite le site relié à Supabase. Suivez le guide de déploiement dans le README.'
const adminTabPaths = {
  overview: '/admin',
  products: '/admin/produits',
  orders: '/admin/commandes',
  categories: '/admin/categories',
  promotions: '/admin/promotions',
  settings: '/admin/reglages',
}
const adminPathTabs = Object.fromEntries(Object.entries(adminTabPaths).map(([tab, path]) => [path, tab]))
const publicPageTitles = {
  '/': 'Accueil',
  '/catalogue': 'Nos gâteaux',
  '/promotions': 'Promotions',
  '/histoire': 'Notre histoire',
  '/contact': 'Contact',
}

function App() {
  const [products, setProducts] = useState(sampleProducts)
  const [categories, setCategories] = useState([])
  const [promotions, setPromotions] = useState(samplePromotions)
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [activeCategory, setActiveCategory] = useState('Tout voir')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderProduct, setOrderProduct] = useState(null)
  const [route, setRoute] = useState(window.location.pathname)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase) return
    let alive = true
    async function loadShop() {
      const [productResult, categoryResult, promoResult, settingResult] = await Promise.all([
        supabase.from('products').select('*, categories(name)').eq('published', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('promotions').select('*').eq('active', true).order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      ])
      if (!alive) return
      if (productResult.error) setNotice(`Chargement du catalogue impossible : ${productResult.error.message}`)
      else setProducts(productResult.data || [])
      if (categoryResult.error) setNotice(`Chargement des catégories impossible : ${categoryResult.error.message}`)
      else setCategories(categoryResult.data || [])
      if (promoResult.error) setNotice(`Chargement des promotions impossible : ${promoResult.error.message}`)
      else setPromotions(promoResult.data || [])
      if (settingResult.error) setNotice(`Chargement des informations du site impossible : ${settingResult.error.message}`)
      else if (settingResult.data) setSettings(settingResult.data)
      setLoading(false)
    }
    loadShop()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const pop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])

  useEffect(() => {
    const pageTitle = publicPageTitles[route] || (route.startsWith('/admin') ? 'Administration' : 'Page introuvable')
    document.title = `${pageTitle} — ${settings.shop_name}`
  }, [route, settings.shop_name])

  function navigate(path, replace = false) {
    if (replace) window.history.replaceState({}, '', path)
    else if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setRoute(path)
    setMobileMenu(false)
    window.scrollTo(0, 0)
  }
  function followRoute(event, path) {
    event.preventDefault()
    navigate(path)
  }

  const categoryNames = useMemo(() => {
    const names = categories.length ? categories.map((item) => item.name) : [...new Set(products.map(getCategory))]
    return ['Tout voir', ...names]
  }, [categories, products])
  const visibleProducts = products.filter((item) => activeCategory === 'Tout voir' || getCategory(item) === activeCategory)
  const today = new Date().toISOString().slice(0, 10)
  const currentPromotions = promotions.filter((item) => item.active && (!item.starts_at || item.starts_at <= today) && (!item.ends_at || item.ends_at >= today))
  const activePromotion = currentPromotions[0]

  function addToCart(product, details = {}) {
    setCart((items) => [...items, { ...details, product, cartId: `${product.id}-${Date.now()}-${Math.random()}` }])
    setOrderProduct(null)
    setCartOpen(true)
  }
  function changeCartQty(cartId, change) {
    setCart((items) => items.map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) + change) } : item))
  }
  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 5500)
  }

  if (route.startsWith('/admin')) return <AdminDashboard route={route} navigate={navigate} onClose={() => navigate('/')} notify={showNotice} />

  const publicPage = publicPageTitles[route] ? route : null
  if (!publicPage) return <div className="public-not-found"><CakeSlice size={34} /><h1>Cette page n’existe pas.</h1><p>Retrouvez nos gâteaux et nos créations depuis l’accueil.</p><a className="button button-dark" href="/" onClick={(event) => followRoute(event, '/')}>Retour à l’accueil <ArrowRight size={16} /></a></div>

  return (
    <div className="app-shell">
      <div className="announcement"><Sparkles size={14} /><span>Une envie sucrée ? Nous préparons vos plus beaux moments.</span><a href="/catalogue" onClick={(event) => followRoute(event, '/catalogue')}>Découvrir nos créations <ArrowRight size={13} /></a></div>
      <header className="site-header">
        <a className="brand" href="/" onClick={(event) => followRoute(event, '/')} aria-label="Douceurs du Gabon, accueil">
          <span className="brand-mark"><CakeSlice size={21} strokeWidth={1.8} /></span>
          <span><b>{settings.shop_name}</b><small>{settings.tagline}</small></span>
        </a>
        <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Ouvrir le menu"><Menu /></button>
        <nav className={mobileMenu ? 'main-nav mobile-open' : 'main-nav'}>
          <a className={route === '/' ? 'active' : ''} href="/" onClick={(event) => followRoute(event, '/')}>Accueil</a>
          <a className={route === '/catalogue' ? 'active' : ''} href="/catalogue" onClick={(event) => followRoute(event, '/catalogue')}>Nos gâteaux</a>
          <a className={route === '/promotions' ? 'active' : ''} href="/promotions" onClick={(event) => followRoute(event, '/promotions')}>Promotions</a>
          <a className={route === '/histoire' ? 'active' : ''} href="/histoire" onClick={(event) => followRoute(event, '/histoire')}>Notre histoire</a>
          <a className={route === '/contact' ? 'active' : ''} href="/contact" onClick={(event) => followRoute(event, '/contact')}>Contact</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button cart-button" aria-label="Ouvrir le panier" onClick={() => setCartOpen(true)}><ShoppingBag size={19} />{cart.length > 0 && <span>{cart.length}</span>}</button>
          <a className="button button-dark header-order" href="/catalogue" onClick={(event) => followRoute(event, '/catalogue')}>Commander <ArrowUpRight size={15} /></a>
        </div>
      </header>

      {notice && <div className="notice" role="alert"><CircleAlert size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Fermer"><X size={16} /></button></div>}

      <main>
        {route === '/' && <section className="hero section-wrap" id="accueil">
          <div className="hero-copy">
            <div className="eyebrow"><span /> PETITES JOIES, GRANDES OCCASIONS</div>
            <h1>Un peu de douceur<br />dans vos <em>beaux jours.</em></h1>
            <p>Des gâteaux préparés avec soin, des ingrédients choisis et beaucoup d’amour. Pour vos fêtes, vos surprises ou juste pour vous.</p>
            <div className="hero-actions"><a className="button button-dark" href="#catalogue">Voir les gâteaux <ArrowRight size={16} /></a><a className="text-link" href="#histoire">Notre savoir-faire <ArrowDown size={14} /></a></div>
            <div className="hero-note"><span className="avatar-stack"><i>♡</i><i>✿</i><i>✦</i></span><span><b>Faits à la commande</b><small>Une attention à chaque bouchée</small></span></div>
          </div>
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=90" alt="Gâteau artisanal à la crème et aux fruits" />
            <div className="hero-image-label"><Sparkles size={15} /><span><b>Fait maison, avec amour</b><small>Des douceurs qui racontent</small></span></div>
            <div className="hero-stamp"><span>100%</span><small>DOUCEUR</small><Heart size={15} fill="currentColor" /></div>
          </div>
          <div className="hero-decoration decoration-one">✳</div><div className="hero-decoration decoration-two">✳</div>
        </section>}

        {route === '/' && activePromotion && <section className="promotion-strip"><div className="promo-icon"><Sparkles size={20} /></div><div><span>LA PETITE ATTENTION DU MOMENT</span><b>{activePromotion.title}</b><p>{activePromotion.description}</p></div><a href={settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : '/contact'} target={settings.whatsapp ? '_blank' : undefined} rel="noreferrer">En savoir plus <ArrowUpRight size={15} /></a></section>}

        {route === '/catalogue' && <section className="public-page-heading section-wrap"><div className="eyebrow"><span /> LE BONHEUR EN PARTS</div><h1>Nos créations <em>maison</em></h1><p>Choisissez votre gâteau, sa taille et votre touche personnelle.</p></section>}
        {(route === '/' || route === '/catalogue') && <section className="catalogue section-wrap" id="catalogue">
          <div className="section-heading"><div><div className="eyebrow"><span /> LE BONHEUR EN PARTS</div><h2>Nos créations <em>maison</em></h2><p>Chaque gâteau est réalisé avec attention, juste pour vous.</p></div><a className="text-link desktop-link" href="#contact">Une demande spéciale ? <ArrowRight size={15} /></a></div>
          <div className="category-row"><div className="category-tabs">{categoryNames.map((name) => <button key={name} className={activeCategory === name ? 'category-tab selected' : 'category-tab'} onClick={() => setActiveCategory(name)}>{name}</button>)}</div><span className="result-count">{loading ? 'Chargement…' : `${visibleProducts.length} douceurs`}</span></div>
          {visibleProducts.length === 0 && !loading ? <div className="empty-catalog"><CakeSlice size={32} /><p>Nos prochaines douceurs arrivent bientôt.</p></div> : <div className="product-grid">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} onOrder={() => setOrderProduct(product)} />)}</div>}
          <div className="catalogue-footer"><span>Préparés à la commande · Ingrédients soigneusement sélectionnés</span><span>Nos prix sont en FCFA</span></div>
        </section>}

        {route === '/promotions' && <section className="public-content-section section-wrap"><div className="public-page-heading"><div className="eyebrow"><span /> PETITES ATTENTIONS</div><h1>Les offres <em>du moment.</em></h1><p>Découvrez nos promotions et faites-vous plaisir en FCFA.</p></div>{currentPromotions.length ? <div className="public-promotion-grid">{currentPromotions.map((promotion) => <article className="public-promotion-card" key={promotion.id}><span className="promo-icon"><Sparkles size={20} /></span><div><span className="eyebrow"><span /> OFFRE GOURMANDE</span><h2>{promotion.title}</h2><p>{promotion.description || 'Contactez-nous pour en savoir plus sur cette offre.'}</p>{(promotion.starts_at || promotion.ends_at) && <small>{promotion.starts_at ? `Du ${promotion.starts_at}` : ''}{promotion.starts_at && promotion.ends_at ? ' ' : ''}{promotion.ends_at ? `au ${promotion.ends_at}` : ''}</small>}</div><a className="button button-outline" href={settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : '/contact'} target={settings.whatsapp ? '_blank' : undefined} rel="noreferrer">En profiter <ArrowRight size={15} /></a></article>)}</div> : <div className="empty-catalog"><Sparkles size={32} /><p>Aucune promotion en cours. Nos douceurs vous attendent au catalogue.</p><a className="text-link" href="/catalogue" onClick={(event) => followRoute(event, '/catalogue')}>Voir les gâteaux <ArrowRight size={15} /></a></div>}</section>}

        {(route === '/' || route === '/histoire') && <section className="promise-section" id="histoire"><div className="promise-image"><img src="https://images.unsplash.com/photo-1557308536-ee471ef2c390?auto=format&fit=crop&w=1000&q=85" alt="Préparation artisanale d'un gâteau" /><div className="image-caption">Un geste après l’autre, avec le cœur.</div></div><div className="promise-copy"><div className="eyebrow"><span /> NOTRE PETIT SECRET</div><h2>Du vrai, du beau,<br />du <em>fait avec cœur.</em></h2><p>Nous croyons aux petites attentions et aux souvenirs qui se partagent autour d’un gâteau. Chaque création est préparée à la commande, avec de bons ingrédients et le souci du détail.</p><div className="promise-points"><div><span><Heart size={17} /></span><div><b>Préparé avec soin</b><small>Fait à la commande, rien que pour vous.</small></div></div><div><span><Sparkles size={17} /></span><div><b>Une touche à vous</b><small>Personnalisez votre gâteau pour l’occasion.</small></div></div></div><a href="/catalogue" onClick={(event) => followRoute(event, '/catalogue')} className="text-link">Trouver votre gâteau <ArrowRight size={15} /></a></div></section>}

        {(route === '/' || route === '/histoire') && <section className="steps-section"><div className="eyebrow"><span /> C’EST TOUT SIMPLE</div><h2>Votre gâteau, en <em>quelques clics.</em></h2><div className="steps-grid"><div className="step"><span className="step-number">01</span><span className="step-icon"><CakeSlice /></span><b>Choisissez</b><p>Trouvez la douceur qui vous ressemble dans notre catalogue.</p></div><div className="step"><span className="step-number">02</span><span className="step-icon"><Pencil /></span><b>Personnalisez</b><p>Indiquez la taille, votre date et votre petite touche personnelle.</p></div><div className="step"><span className="step-number">03</span><span className="step-icon"><PackageCheck /></span><b>Savourez</b><p>Retirez votre commande ou recevez-la à l’adresse indiquée.</p></div></div></section>}

        {route === '/histoire' && <section className="public-content-section section-wrap story-page-note"><div className="eyebrow"><span /> UNE DOUCEUR À PARTAGER</div><h2>Créons ensemble votre prochain <em>beau souvenir.</em></h2><a className="button button-dark" href="/catalogue" onClick={(event) => followRoute(event, '/catalogue')}>Découvrir les gâteaux <ArrowRight size={16} /></a></section>}

        {(route === '/' || route === '/contact') && <section className="contact-band" id="contact"><div className="contact-flower">✳</div><div><span>UN GÂTEAU EN TÊTE ?</span><h2>On en parle ensemble.</h2><p>Une question ou une création sur mesure ? Écrivez-nous.</p>{settings.address && <small className="contact-address">{settings.address}</small>}</div><div className="contact-links">{settings.whatsapp && <a className="button button-light" href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>}{settings.phone && <a className="contact-phone" href={`tel:${settings.phone}`}><Phone size={16} /> {settings.phone}</a>}{!settings.phone && !settings.whatsapp && <span className="contact-placeholder">Coordonnées bientôt disponibles</span>}</div></section>}
      </main>
      <footer className="site-footer"><a className="brand footer-brand" href="/" onClick={(event) => followRoute(event, '/')}><span className="brand-mark"><CakeSlice size={19} /></span><span><b>{settings.shop_name}</b><small>Des gâteaux faits avec amour</small></span></a><div className="footer-meta"><span>Fait avec soin au Gabon · Prix en FCFA</span><a className="admin-link" href="/admin/login" onClick={(event) => followRoute(event, '/admin/login')}><ShieldCheck size={14} /> Espace admin</a></div><span className="footer-copy">© {new Date().getFullYear()} {settings.shop_name}</span></footer>
      {orderProduct && <OrderDialog product={orderProduct} settings={settings} onClose={() => setOrderProduct(null)} onAdd={addToCart} notify={showNotice} />}
      {cartOpen && <CartDrawer cart={cart} settings={settings} onClose={() => setCartOpen(false)} onRemove={(id) => setCart((items) => items.filter((item) => item.cartId !== id))} onQuantity={changeCartQty} notify={showNotice} onClear={() => setCart([])} />}
    </div>
  )
}

function ProductCard({ product, index, onOrder }) {
  const sale = getDiscountPrice(product) < product.price
  return <article className="product-card" style={{ '--card-order': index }}>
    <button className="product-image" onClick={onOrder} aria-label={`Commander ${product.name}`}>
      <img src={product.image_url || imageFallback} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = imageFallback }} />
      <span className="product-category">{getCategory(product)}</span>
      {sale && <span className="sale-badge">OFFRE</span>}
      <span className={product.available ? 'availability available' : 'availability unavailable'}><i />{product.available ? 'Disponible' : 'Indisponible'}</span>
    </button>
    <div className="product-details"><div className="product-title-line"><h3>{product.name}</h3><button className="favorite-button" onClick={onOrder} aria-label="Choisir ce gâteau"><Heart size={17} /></button></div><p>{product.description}</p><div className="product-buy"><div className="product-price">{sale && <del>{formatPrice(product.price)}</del>}<b>{formatPrice(getDiscountPrice(product))}</b></div><button className="add-button" onClick={onOrder} disabled={!product.available} aria-label={`Ajouter ${product.name}`}><Plus size={18} /></button></div></div>
  </article>
}

function OrderDialog({ product, settings, onClose, onAdd, notify }) {
  const [size, setSize] = useState('6 parts')
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState('')
  const [customization, setCustomization] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sizeOptions = ['4 parts', '6 parts', '8 parts', '10 parts']
  const price = getDiscountPrice(product)
  function add() {
    if (!product.available) return
    setSubmitting(true)
    onAdd(product, { size, quantity, requested_date: date, customization, unit_price: price })
    setSubmitting(false)
    notify('Ajouté à votre panier. Complétez votre commande quand vous êtes prêt(e).')
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
    <button className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button><div className="order-modal-image"><img src={product.image_url || imageFallback} alt={product.name} /><span>{getCategory(product)}</span></div>
    <div className="order-modal-content"><div className="eyebrow"><span /> À VOUS DE CHOISIR</div><h2 id="order-title">{product.name}</h2><p className="modal-description">{product.description}</p><div className="modal-price">{formatPrice(price)} <span>/ gâteau</span></div>
      <label className="field-label">Taille</label><div className="size-options">{sizeOptions.map((option) => <button key={option} className={size === option ? 'size-option active' : 'size-option'} onClick={() => setSize(option)}>{option}</button>)}</div>
      <label className="field-label" htmlFor="order-date">Date souhaitée</label><input className="form-input" id="order-date" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
      <label className="field-label" htmlFor="order-customization">Personnalisation <small>(facultatif)</small></label><textarea className="form-input" id="order-customization" rows="2" placeholder="Un prénom, un message, vos envies…" value={customization} onChange={(event) => setCustomization(event.target.value)} />
      <div className="quantity-row"><span>Quantité</span><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuer"><Minus size={15} /></button><b>{quantity}</b><button onClick={() => setQuantity(quantity + 1)} aria-label="Augmenter"><Plus size={15} /></button></div></div>
      <button className="button button-dark modal-submit" onClick={add} disabled={!product.available || submitting}>{product.available ? <>Ajouter au panier · {formatPrice(price * quantity)} <ArrowRight size={16} /></> : 'Indisponible'}</button>
    </div>
  </section></div>
}

function CartDrawer({ cart, settings, onClose, onRemove, onQuantity, notify, onClear }) {
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', fulfillment: settings.pickup_enabled ? 'pickup' : 'delivery', delivery_address: '', payment_method: 'Airtel Money' })
  const [submitting, setSubmitting] = useState(false)
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price || getDiscountPrice(item.product)) * (Number(item.quantity) || 1), 0)
  const fee = form.fulfillment === 'delivery' ? Number(settings.delivery_fee) || 0 : 0
  const total = subtotal + fee
  const paymentNumber = form.payment_method === 'Airtel Money' ? settings.airtel_money_phone : settings.moov_money_phone
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    if (!cart.length) return
    if (!supabase) { notify(publicErrorMessage); return }
    if (form.fulfillment === 'delivery' && !form.delivery_address.trim()) { notify('Merci d’indiquer l’adresse de livraison.'); return }
    const whatsappWindow = settings.whatsapp ? window.open('about:blank', '_blank') : null
    if (whatsappWindow) whatsappWindow.opener = null
    setSubmitting(true)
    const customization = cart.map((item) => `${item.product.name} (${item.size}): ${item.customization || 'sans personnalisation'}`).join(' | ')
    const items = cart.map((item) => ({
      product_id: item.product.id,
      size: item.size,
      quantity: Number(item.quantity) || 1,
      customization: item.customization || '',
      requested_date: item.requested_date || null,
    }))
    const { data: confirmation, error } = await supabase.rpc('submit_order', {
      p_customer_name: form.customer_name,
      p_customer_phone: form.customer_phone,
      p_customer_email: form.customer_email || '',
      p_items: items,
      p_customization: customization,
      p_fulfillment: form.fulfillment,
      p_delivery_address: form.delivery_address || '',
      p_payment_method: form.payment_method,
    })
    setSubmitting(false)
    if (error) {
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close()
      notify(`Commande non enregistrée : ${error.message}`)
      return
    }
    const lines = confirmation.items.map((item) => `• ${item.quantity} × ${item.name} (${item.size}) — ${formatPrice(item.unit_price)}${item.requested_date ? ` — pour le ${item.requested_date}` : ''}`).join('\n')
    const verifiedTotal = Number(confirmation.total)
    const message = `Bonjour, je souhaite confirmer la commande #${String(confirmation.id).slice(0, 8)} :\n${lines}\nTotal : ${formatPrice(verifiedTotal)}\nNom : ${form.customer_name}\nTéléphone : ${form.customer_phone}\n${form.fulfillment === 'delivery' ? `Livraison : ${form.delivery_address}` : 'Retrait en boutique'}`
    onClear()
    if (settings.whatsapp) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        notify('Votre commande est enregistrée ! Finalisez sa confirmation sur WhatsApp.')
      } else notify(`Votre commande est enregistrée. Contactez-nous sur WhatsApp au ${settings.whatsapp} pour la confirmer.`)
    } else notify('Votre commande est enregistrée. La boutique vous recontactera avec les coordonnées fournies.')
  }
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Votre commande"><div className="drawer-heading"><div><span className="eyebrow"><span /> ON S’OCCUPE DE TOUT</span><h2>Votre panier <em>tout doux.</em></h2></div><button className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button></div>
    {cart.length === 0 ? <div className="cart-empty"><ShoppingBag size={34} /><p>Votre panier attend sa première douceur.</p><button className="button button-dark" onClick={onClose}>Voir les gâteaux <ArrowRight size={15} /></button></div> : <form className="cart-form" onSubmit={submit}>
      <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.cartId}><img src={item.product.image_url || imageFallback} alt="" /><div className="cart-item-info"><b>{item.product.name}</b><small>{item.size} · {formatPrice(item.unit_price || getDiscountPrice(item.product))}</small>{item.requested_date && <small>Pour le {item.requested_date}</small>}{item.customization && <small>{item.customization}</small>}<div className="quantity-control small"><button type="button" onClick={() => onQuantity(item.cartId, -1)}><Minus size={13} /></button><b>{item.quantity}</b><button type="button" onClick={() => onQuantity(item.cartId, 1)}><Plus size={13} /></button></div></div><div className="cart-item-end"><b>{formatPrice((item.unit_price || getDiscountPrice(item.product)) * item.quantity)}</b><button type="button" className="remove-item" onClick={() => onRemove(item.cartId)} aria-label="Supprimer"><Trash2 size={15} /></button></div></div>)}</div>
      <div className="checkout-fields"><div className="checkout-section-label">VOS COORDONNÉES</div><div className="form-grid"><label>Nom complet<input className="form-input" required value={form.customer_name} onChange={(event) => update('customer_name', event.target.value)} /></label><label>Téléphone<input className="form-input" required type="tel" inputMode="tel" placeholder="+241 …" value={form.customer_phone} onChange={(event) => update('customer_phone', event.target.value)} /></label><label className="full-field">E-mail <small>(facultatif)</small><input className="form-input" type="email" value={form.customer_email} onChange={(event) => update('customer_email', event.target.value)} /></label></div>
        <div className="checkout-section-label">RETRAIT OU LIVRAISON</div><div className="fulfillment-options">{settings.pickup_enabled && <button type="button" className={form.fulfillment === 'pickup' ? 'fulfillment-choice chosen' : 'fulfillment-choice'} onClick={() => update('fulfillment', 'pickup')}><PackageCheck size={17} /> Retrait</button>}{settings.delivery_enabled && <button type="button" className={form.fulfillment === 'delivery' ? 'fulfillment-choice chosen' : 'fulfillment-choice'} onClick={() => update('fulfillment', 'delivery')}><Truck size={17} /> Livraison</button>}</div>{form.fulfillment === 'delivery' && <label className="full-field">Adresse de livraison<input className="form-input" required value={form.delivery_address} onChange={(event) => update('delivery_address', event.target.value)} />{settings.delivery_fee > 0 && <small>Frais : {formatPrice(settings.delivery_fee)}</small>}</label>}
        <div className="checkout-section-label">MOYEN DE PAIEMENT</div><div className="payment-options">{['Airtel Money', 'Moov Money', 'Paiement à la remise'].map((method) => <button type="button" className={form.payment_method === method ? 'payment-choice chosen' : 'payment-choice'} key={method} onClick={() => update('payment_method', method)}>{method === 'Airtel Money' ? 'Airtel' : method === 'Moov Money' ? 'Moov Money' : 'À la remise'}</button>)}</div>{form.payment_method !== 'Paiement à la remise' && <small className="payment-account">{paymentNumber ? `${form.payment_method} : ${paymentNumber}` : 'Les informations de paiement vous seront communiquées lors de la confirmation.'}</small>}<small className="payment-note">Le paiement est confirmé directement avec notre équipe. Ne partagez jamais votre code secret.</small></div>
      <div className="cart-total"><div><span>Sous-total</span><b>{formatPrice(subtotal)}</b></div>{fee > 0 && <div><span>Livraison</span><b>{formatPrice(fee)}</b></div>}<div className="total-line"><span>Total</span><b>{formatPrice(total)}</b></div></div><button className="button button-dark checkout-button" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : <>{supabase ? 'Envoyer ma commande' : 'Configurer le site pour commander'} <ArrowRight size={16} /></>}</button><p className="checkout-footnote"><ShieldCheck size={14} /> Vos informations servent uniquement à traiter la commande.</p>
    </form>}</aside></div>
}

const adminTabs = [
  { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'products', label: 'Gâteaux', icon: CakeSlice },
  { id: 'orders', label: 'Commandes', icon: ClipboardList },
  { id: 'categories', label: 'Catégories', icon: Tags },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
  { id: 'settings', label: 'Boutique & paiements', icon: Settings },
]

function AdminDashboard({ route, navigate, onClose, notify }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const tab = adminPathTabs[route] || 'overview'
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [promotions, setPromotions] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [busy, setBusy] = useState(false)
  const [productEditor, setProductEditor] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [promoEditor, setPromoEditor] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [mobileSidebar, setMobileSidebar] = useState(false)

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authLoading && session && route === '/admin/login') navigate('/admin', true)
  }, [authLoading, session, route])

  useEffect(() => {
    if (!session || !supabase) return
    let alive = true
    async function loadAdmin() {
      const [profile, productsResult, ordersResult, categoriesResult, promotionsResult, settingsResult] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle(),
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('categories').select('*').order('name'),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      ])
      if (!alive) return
      if (profile.error || profile.data?.role !== 'admin') {
        setAuthError(profile.error?.message || 'Ce compte n’a pas les droits administrateur.')
        await supabase.auth.signOut()
        setSession(null)
        return
      }
      for (const [result, label, setter] of [
        [productsResult, 'produits', setProducts], [ordersResult, 'commandes', setOrders],
        [categoriesResult, 'catégories', setCategories], [promotionsResult, 'promotions', setPromotions],
      ]) {
        if (result.error) setSaveMessage(`Chargement des ${label} impossible : ${result.error.message}`)
        else setter(result.data || [])
      }
      if (settingsResult.error) setSaveMessage(`Chargement des réglages impossible : ${settingsResult.error.message}`)
      else if (settingsResult.data) setSettings(settingsResult.data)
    }
    loadAdmin()
    return () => { alive = false }
  }, [session])

  async function signIn(event) {
    event.preventDefault()
    if (!supabase) { setAuthError(publicErrorMessage); return }
    setAuthLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setAuthLoading(false)
    if (error) setAuthError(error.message)
    else navigate('/admin', true)
  }
  async function signOut() {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) { setAuthError(`Déconnexion impossible : ${error.message}`); return }
    }
    setSession(null)
    navigate('/admin/login', true)
  }
  function goTab(nextTab) {
    navigate(adminTabPaths[nextTab] || adminTabPaths.overview)
    setMobileSidebar(false)
  }
  function report(message, error) {
    if (error) { setSaveMessage(`${message} : ${error.message}`); return false }
    setSaveMessage('')
    notify(message)
    return true
  }
  async function refreshProducts() {
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
    else setSaveMessage(`Actualisation des produits impossible : ${error.message}`)
  }
  async function saveProduct(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const publishIntent = event.nativeEvent.submitter?.value
    setBusy(true)
    let imageUrl = data.get('image_url')?.toString().trim() || ''
    const file = data.get('photo')
    if ((!file || file.size === 0) && !imageUrl) {
      setBusy(false)
      setSaveMessage('Ajoutez une photo du gâteau ou indiquez une adresse de photo.')
      return
    }
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        setBusy(false)
        setSaveMessage('La photo dépasse la limite de 5 Mo.')
        return
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setBusy(false)
        setSaveMessage('Format de photo non pris en charge. Utilisez JPG, PNG ou WebP.')
        return
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('cake-photos').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })
      if (uploadError) { setBusy(false); setSaveMessage(`Téléversement de la photo impossible : ${uploadError.message}`); return }
      imageUrl = supabase.storage.from('cake-photos').getPublicUrl(path).data.publicUrl
    }
    const price = Number(data.get('price'))
    const promoPrice = data.get('promo_price') ? Number(data.get('promo_price')) : null
    const product = {
      name: data.get('name').toString().trim(), description: data.get('description').toString().trim(),
      category_id: data.get('category_id') || null, price, promo_price: promoPrice,
      image_url: imageUrl, available: data.get('available') === 'on', published: publishIntent === 'publish',
    }
    const query = productEditor?.id ? supabase.from('products').update(product).eq('id', productEditor.id) : supabase.from('products').insert(product)
    const { error } = await query
    setBusy(false)
    if (report(productEditor?.id ? 'Gâteau modifié.' : 'Gâteau enregistré.', error)) { setProductEditor(null); await refreshProducts() }
  }
  async function togglePublished(product) {
    const { error } = await supabase.from('products').update({ published: !product.published }).eq('id', product.id)
    if (report(product.published ? 'Gâteau dépublié.' : 'Gâteau publié.', error)) await refreshProducts()
  }
  async function deleteProduct(product) {
    if (!window.confirm(`Supprimer « ${product.name} » ? Cette action est définitive.`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (report('Gâteau supprimé.', error)) await refreshProducts()
  }
  async function updateOrder(order, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
    if (report('Statut de commande mis à jour.', error)) setOrders((items) => items.map((item) => item.id === order.id ? { ...item, status } : item))
  }
  async function deleteOrder(order) {
    if (!window.confirm(`Supprimer définitivement la commande de ${order.customer_name} ?`)) return
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (report('Commande supprimée.', error)) setOrders((items) => items.filter((item) => item.id !== order.id))
  }
  async function addCategory(event) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    const { data, error } = await supabase.from('categories').insert({ name }).select().single()
    if (report('Catégorie ajoutée.', error)) { setCategories((items) => [...items, data].sort((a, b) => a.name.localeCompare(b.name))); setCategoryName('') }
  }
  async function removeCategory(category) {
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » ?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (report('Catégorie supprimée.', error)) { setCategories((items) => items.filter((item) => item.id !== category.id)); await refreshProducts() }
  }
  async function renameCategory(category) {
    const name = window.prompt('Nouveau nom de catégorie', category.name)?.trim()
    if (!name || name === category.name) return
    const { error } = await supabase.from('categories').update({ name }).eq('id', category.id)
    if (report('Catégorie modifiée.', error)) {
      setCategories((items) => items.map((item) => item.id === category.id ? { ...item, name } : item))
      await refreshProducts()
    }
  }
  async function savePromotion(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const promo = { title: data.get('title').toString().trim(), description: data.get('description').toString().trim(), active: data.get('active') === 'on', starts_at: data.get('starts_at') || null, ends_at: data.get('ends_at') || null }
    const result = promoEditor?.id ? await supabase.from('promotions').update(promo).eq('id', promoEditor.id) : await supabase.from('promotions').insert(promo)
    if (report('Promotion enregistrée.', result.error)) {
      const { data: updated, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
      if (error) setSaveMessage(`Actualisation des promotions impossible : ${error.message}`)
      else setPromotions(updated || [])
      setPromoEditor(null)
    }
  }
  async function deletePromotion(promo) {
    if (!window.confirm(`Supprimer la promotion « ${promo.title} » ?`)) return
    const { error } = await supabase.from('promotions').delete().eq('id', promo.id)
    if (report('Promotion supprimée.', error)) setPromotions((items) => items.filter((item) => item.id !== promo.id))
  }
  async function saveSettings(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const updated = {
      id: 1, shop_name: data.get('shop_name').toString().trim(), tagline: data.get('tagline').toString().trim(),
      phone: data.get('phone').toString().trim(), whatsapp: data.get('whatsapp').toString().trim(), address: data.get('address').toString().trim(),
      delivery_fee: Number(data.get('delivery_fee')) || 0, pickup_enabled: data.get('pickup_enabled') === 'on',
      delivery_enabled: data.get('delivery_enabled') === 'on', airtel_money_phone: data.get('airtel_money_phone').toString().trim(),
      moov_money_phone: data.get('moov_money_phone').toString().trim(),
    }
    if (!updated.pickup_enabled && !updated.delivery_enabled) {
      setSaveMessage('Activez au moins une option : retrait ou livraison.')
      return
    }
    const { error } = await supabase.from('site_settings').upsert(updated)
    if (report('Informations de la boutique enregistrées.', error)) setSettings(updated)
  }

  if (authLoading) return <div className="admin-loading"><LoaderCircle className="spin" /> Vérification de la session…</div>
  if (!session) return <div className="admin-login-page"><button className="admin-back-link" onClick={onClose}><ArrowLeft size={16} /> Retour à la boutique</button><div className="admin-login-card"><span className="brand-mark login-mark"><ShieldCheck size={23} /></span><div className="eyebrow"><span /> ESPACE PRIVÉ</div><h1>Heureuse de vous revoir.</h1><p>Connectez-vous pour gérer votre boutique et vos commandes.</p>{!supabase && <div className="inline-warning"><CircleAlert size={17} /> Connectez le projet à Supabase pour activer l’espace administrateur.</div>}{authError && <div className="inline-error" role="alert">{authError}</div>}<form onSubmit={signIn}><label>Adresse e-mail<input className="form-input" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Mot de passe<input className="form-input" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-dark" type="submit" disabled={authLoading}>Se connecter <ArrowRight size={16} /></button></form><small className="login-secure"><ShieldCheck size={13} /> Accès réservé aux administrateurs autorisés</small></div></div>

  const pendingCount = orders.filter((item) => item.status === 'pending').length
  return <div className="admin-layout">
    <aside className={mobileSidebar ? 'admin-sidebar sidebar-open' : 'admin-sidebar'}><div className="admin-side-brand"><span className="brand-mark"><CakeSlice size={20} /></span><span><b>{settings.shop_name}</b><small>Administration</small></span><button className="sidebar-mobile-close" onClick={() => setMobileSidebar(false)} aria-label="Fermer"><X size={18} /></button></div><div className="admin-nav-label">MENU PRINCIPAL</div><nav className="admin-nav">{adminTabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'admin-nav-item active' : 'admin-nav-item'} onClick={() => goTab(id)}><Icon size={18} />{label}{id === 'orders' && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}</button>)}</nav><div className="admin-side-bottom"><div className="admin-user"><span className="admin-avatar">{session.user.email?.[0]?.toUpperCase()}</span><span><b>{session.user.email}</b><small>Administrateur</small></span></div><button className="admin-nav-item logout-button" onClick={signOut}><LogOut size={17} /> Se déconnecter</button><button className="admin-store-link" onClick={onClose}><ArrowLeft size={15} /> Voir la boutique</button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMobileSidebar(true)} aria-label="Menu"><Menu /></button><div className="admin-breadcrumb">Boutique <span>/</span> <b>{adminTabs.find((item) => item.id === tab)?.label}</b></div><a className="admin-preview-link" href="/" target="_blank" rel="noreferrer"><Eye size={15} /> Voir le site <ArrowUpRight size={14} /></a></header><div className="admin-content">
      {saveMessage && <div className="admin-alert"><CircleAlert size={17} />{saveMessage}<button onClick={() => setSaveMessage('')}><X size={16} /></button></div>}
      {tab === 'overview' && <OverviewPanel products={products} orders={orders} pendingCount={pendingCount} goTab={goTab} />}
      {tab === 'products' && <ProductsPanel products={products} categories={categories} onNew={() => setProductEditor({})} onEdit={setProductEditor} onToggle={togglePublished} onDelete={deleteProduct} />}
      {tab === 'orders' && <OrdersPanel orders={orders} onStatus={updateOrder} onDelete={deleteOrder} />}
      {tab === 'categories' && <CategoriesPanel categories={categories} categoryName={categoryName} setCategoryName={setCategoryName} onAdd={addCategory} onRename={renameCategory} onDelete={removeCategory} products={products} />}
      {tab === 'promotions' && <PromotionsPanel promotions={promotions} onNew={() => setPromoEditor({})} onEdit={setPromoEditor} onDelete={deletePromotion} />}
      {tab === 'settings' && <SettingsPanel settings={settings} onSave={saveSettings} />}
    </div></main>
    {productEditor && <ProductEditor product={productEditor} categories={categories} onClose={() => setProductEditor(null)} onSave={saveProduct} busy={busy} />}
    {promoEditor && <PromotionEditor promotion={promoEditor} onClose={() => setPromoEditor(null)} onSave={savePromotion} />}
  </div>
}

function AdminPageTitle({ eyebrow, title, description, action }) {
  return <div className="admin-page-title"><div><div className="eyebrow"><span /> {eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function OverviewPanel({ products, orders, pendingCount, goTab }) {
  const totalSales = orders.filter((order) => !['cancelled', 'pending'].includes(order.status)).reduce((sum, order) => sum + Number(order.total || 0), 0)
  const metrics = [{ label: 'Gâteaux au catalogue', value: products.length, icon: CakeSlice }, { label: 'Commandes en attente', value: pendingCount, icon: Clock3 }, { label: 'Commandes reçues', value: orders.length, icon: ClipboardList }, { label: 'Ventes confirmées', value: formatPrice(totalSales), icon: ShoppingBag }]
  return <><AdminPageTitle eyebrow="VOTRE BOUTIQUE EN UN COUP D’ŒIL" title="Bonjour, pâtissier·ère !" description="Voici ce qui se passe dans votre boutique aujourd’hui." action={<button className="button button-dark" onClick={() => goTab('products')}><Plus size={16} /> Ajouter un gâteau</button>} /><div className="metric-grid">{metrics.map(({ label, value, icon: Icon }) => <div className="metric-card" key={label}><span className="metric-icon"><Icon size={19} /></span><small>{label}</small><b>{value}</b></div>)}</div><div className="admin-overview-grid"><section className="admin-panel"><div className="panel-heading"><div><h2>Dernières commandes</h2><p>Gardez un œil sur les demandes récentes.</p></div><button className="panel-link" onClick={() => goTab('orders')}>Toutes les commandes <ArrowRight size={14} /></button></div>{orders.slice(0, 5).length ? <div className="compact-orders">{orders.slice(0, 5).map((order) => <div className="compact-order" key={order.id}><span className="order-initial">{order.customer_name?.[0]?.toUpperCase() || '?'}</span><span><b>{order.customer_name}</b><small>{new Date(order.created_at).toLocaleDateString('fr-FR')} · {order.items?.length || 0} article(s)</small></span><span className={`status-pill ${order.status}`}>{statusLabel(order.status)}</span><b>{formatPrice(order.total)}</b></div>)}</div> : <div className="panel-empty">Vos nouvelles commandes apparaîtront ici.</div>}</section><section className="admin-panel quick-panel"><div className="panel-heading"><div><h2>En un clin d’œil</h2><p>Les prochains gestes utiles.</p></div><Sparkles size={20} /></div><button onClick={() => goTab('products')}><span><CakeSlice size={17} /></span><b>Mettre à jour les gâteaux</b><ArrowRight size={15} /></button><button onClick={() => goTab('orders')}><span><ClipboardList size={17} /></span><b>Traiter les commandes</b><ArrowRight size={15} /></button><button onClick={() => goTab('settings')}><span><Settings size={17} /></span><b>Vérifier vos coordonnées</b><ArrowRight size={15} /></button></section></div></>
}

function ProductsPanel({ products, categories, onNew, onEdit, onToggle, onDelete }) {
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? products : filter === 'published' ? products.filter((item) => item.published) : products.filter((item) => !item.published)
  return <><AdminPageTitle eyebrow="VOTRE VITRINE" title="Les gâteaux" description="Ajoutez, modifiez et publiez vos créations." action={<button className="button button-dark" onClick={onNew}><Plus size={16} /> Ajouter un gâteau</button>} /><div className="admin-filter-row"><div className="filter-pills">{[['all', 'Tous'], ['published', 'Publiés'], ['draft', 'Brouillons']].map(([key, label]) => <button key={key} className={filter === key ? 'filter-pill selected' : 'filter-pill'} onClick={() => setFilter(key)}>{label} {key === 'all' ? products.length : key === 'published' ? products.filter((item) => item.published).length : products.filter((item) => !item.published).length}</button>)}</div><span>{categories.length} catégorie(s)</span></div>{shown.length ? <div className="admin-product-grid">{shown.map((product) => <div className="admin-product-card" key={product.id}><div className="admin-product-image"><img src={product.image_url || imageFallback} alt="" /><span className={product.published ? 'status-pill published' : 'status-pill draft'}>{product.published ? 'Publié' : 'Brouillon'}</span></div><div className="admin-product-info"><div className="admin-product-meta">{product.categories?.name || 'Sans catégorie'} · {product.available ? 'Disponible' : 'Indisponible'}</div><h3>{product.name}</h3><b>{formatPrice(getDiscountPrice(product))}{product.promo_price && product.promo_price < product.price && <del>{formatPrice(product.price)}</del>}</b><div className="admin-card-actions"><button onClick={() => onEdit(product)}><Pencil size={14} /> Modifier</button><button onClick={() => onToggle(product)}>{product.published ? <><EyeOff size={14} /> Dépublier</> : <><Eye size={14} /> Publier</>}</button><button className="danger-action" onClick={() => onDelete(product)} aria-label="Supprimer"><Trash2 size={14} /></button></div></div></div>)}</div> : <div className="admin-empty"><CakeSlice size={31} /><b>Aucun gâteau pour le moment</b><p>Ajoutez votre première création pour commencer.</p><button className="button button-dark" onClick={onNew}><Plus size={16} /> Ajouter un gâteau</button></div>}</>
}

const statusLabel = (status) => ({ pending: 'En attente', confirmed: 'Confirmée', preparing: 'En préparation', ready: 'Prête', delivered: 'Livrée', cancelled: 'Annulée' })[status] || status
function OrdersPanel({ orders, onStatus, onDelete }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? orders : orders.filter((order) => order.status === filter)
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
  return <>
    <AdminPageTitle eyebrow="VOTRE CARNET DE COMMANDES" title="Les commandes" description="Suivez les demandes et tenez vos clients informés." />
    <div className="filter-pills order-filters">{[['all', 'Toutes'], ...statuses.map((value) => [value, statusLabel(value)])].map(([key, label]) => <button key={key} className={filter === key ? 'filter-pill selected' : 'filter-pill'} onClick={() => setFilter(key)}>{label}</button>)}</div>
    {filtered.length ? <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Commande</th><th>Client</th><th>Articles</th><th>Retrait / livraison</th><th>Paiement</th><th>Total</th><th>Statut</th><th></th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}>
      <td><b>#{order.id.slice(0, 7).toUpperCase()}</b><small>{new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</small></td>
      <td><b>{order.customer_name}</b><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>{order.customer_email && <small>{order.customer_email}</small>}</td>
      <td>{order.items?.map((item, index) => <div className="order-item-line" key={index}>{item.quantity}× {item.name} <small>{item.size}</small>{item.requested_date && <small> · {item.requested_date}</small>}</div>)}{order.customization && <small className="order-custom">✦ {order.customization}</small>}</td>
      <td>{order.fulfillment === 'delivery' ? <><Truck size={14} /> Livrer<small>{order.delivery_address}</small></> : <><PackageCheck size={14} /> Retrait</>}{order.requested_date && <small>Date : {order.requested_date}</small>}</td>
      <td>{order.payment_method}</td><td><b>{formatPrice(order.total)}</b></td>
      <td><select className={`status-select ${order.status}`} value={order.status} onChange={(event) => onStatus(order, event.target.value)} aria-label={`Statut de commande ${order.id}`}>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td>
      <td><button className="danger-action order-delete" onClick={() => onDelete(order)} aria-label={`Supprimer la commande ${order.id}`}><Trash2 size={15} /></button></td>
    </tr>)}</tbody></table></div> : <div className="admin-empty"><ClipboardList size={31} /><b>Aucune commande ici</b><p>Les prochaines commandes de vos clients s’afficheront ici.</p></div>}
  </>
}

function CategoriesPanel({ categories, categoryName, setCategoryName, onAdd, onRename, onDelete, products }) {
  return <>
    <AdminPageTitle eyebrow="ORGANISEZ VOTRE VITRINE" title="Les catégories" description="Aidez vos clients à trouver leur gâteau." />
    <div className="admin-panel category-manager"><div className="panel-heading"><div><h2>Ajouter une catégorie</h2><p>Par exemple : anniversaire, chocolat ou mariage.</p></div><Tags size={20} /></div>
      <form className="category-add-form" onSubmit={onAdd}><input className="form-input" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nom de la catégorie" required /><button className="button button-dark" type="submit"><Plus size={16} /> Ajouter</button></form>
      {categories.length ? <div className="category-list">{categories.map((category) => <div className="category-list-item" key={category.id}><span className="category-tag-icon"><Tags size={16} /></span><b>{category.name}</b><small>{products.filter((product) => product.category_id === category.id).length} gâteau(x)</small><button className="category-action" onClick={() => onRename(category)} aria-label={`Modifier ${category.name}`}><Pencil size={14} /></button><button className="danger-action" onClick={() => onDelete(category)} aria-label={`Supprimer ${category.name}`}><Trash2 size={15} /></button></div>)}</div> : <div className="panel-empty">Aucune catégorie pour l’instant.</div>}
    </div>
  </>
}

function PromotionsPanel({ promotions, onNew, onEdit, onDelete }) {
  return <><AdminPageTitle eyebrow="UNE PETITE SURPRISE EN PLUS" title="Les promotions" description="Mettez vos offres à l’honneur sur la page d’accueil." action={<button className="button button-dark" onClick={onNew}><Plus size={16} /> Nouvelle promotion</button>} /><div className="promotion-admin-list">{promotions.length ? promotions.map((promo) => <article className="promotion-admin-card" key={promo.id}><span className="promotion-admin-icon"><Megaphone size={21} /></span><div className="promotion-admin-copy"><div><b>{promo.title}</b><span className={promo.active ? 'status-pill published' : 'status-pill draft'}>{promo.active ? 'Active' : 'Inactive'}</span></div><p>{promo.description}</p><small>{promo.starts_at || promo.ends_at ? `${promo.starts_at || 'Dès maintenant'} → ${promo.ends_at || 'Sans date de fin'}` : 'Aucune date définie'}</small></div><div className="admin-card-actions"><button onClick={() => onEdit(promo)}><Pencil size={14} /> Modifier</button><button className="danger-action" onClick={() => onDelete(promo)} aria-label="Supprimer"><Trash2 size={14} /></button></div></article>) : <div className="admin-empty"><Megaphone size={31} /><b>Aucune promotion</b><p>Créez une offre pour la mettre en avant sur le site.</p><button className="button button-dark" onClick={onNew}><Plus size={16} /> Nouvelle promotion</button></div>}</div></>
}

function SettingsPanel({ settings, onSave }) {
  return <><AdminPageTitle eyebrow="LES PETITS DÉTAILS QUI COMPTENT" title="Votre boutique" description="Coordonnées, moyens de paiement et options de livraison." /><form className="settings-form" onSubmit={onSave}>
    <section className="admin-panel settings-card"><div className="panel-heading"><div><h2>Nom et coordonnées</h2><p>Ces informations apparaissent sur votre site.</p></div><Phone size={19} /></div><div className="form-grid"><label>Nom de la boutique<input className="form-input" name="shop_name" required defaultValue={settings.shop_name} /></label><label>Signature / slogan<input className="form-input" name="tagline" defaultValue={settings.tagline} /></label><label>Téléphone<input className="form-input" name="phone" type="tel" placeholder="+241 …" defaultValue={settings.phone} /></label><label>WhatsApp<input className="form-input" name="whatsapp" type="tel" placeholder="+241 …" defaultValue={settings.whatsapp} /><small>Format international recommandé, ex. +241…</small></label><label className="full-field">Adresse ou zone desservie<input className="form-input" name="address" defaultValue={settings.address} /></label></div></section>
    <section className="admin-panel settings-card"><div className="panel-heading"><div><h2>Paiements mobiles</h2><p>Renseignez les numéros destinés aux transferts. Le paiement est vérifié manuellement.</p></div><ShieldCheck size={19} /></div><div className="form-grid"><label>Airtel Money<input className="form-input" name="airtel_money_phone" type="tel" placeholder="Numéro Airtel Money" defaultValue={settings.airtel_money_phone} /></label><label>Moov Money<input className="form-input" name="moov_money_phone" type="tel" placeholder="Numéro Moov Money" defaultValue={settings.moov_money_phone} /></label></div><p className="settings-note"><ShieldCheck size={15} /> Ne demandez jamais et ne stockez jamais de code PIN ou de code secret.</p></section>
    <section className="admin-panel settings-card"><div className="panel-heading"><div><h2>Retrait et livraison</h2><p>Choisissez les options proposées aux clients.</p></div><Truck size={19} /></div><div className="settings-toggles"><label className="toggle-row"><span><b>Retrait</b><small>Les clients peuvent récupérer leur commande.</small></span><input type="checkbox" name="pickup_enabled" defaultChecked={settings.pickup_enabled} /></label><label className="toggle-row"><span><b>Livraison</b><small>Proposer la livraison aux clients.</small></span><input type="checkbox" name="delivery_enabled" defaultChecked={settings.delivery_enabled} /></label></div><label className="delivery-fee-label">Frais de livraison (FCFA)<input className="form-input" name="delivery_fee" type="number" min="0" step="1" defaultValue={settings.delivery_fee} /></label></section>
    <div className="settings-save-row"><span>Les modifications seront visibles après enregistrement.</span><button className="button button-dark" type="submit"><Check size={16} /> Enregistrer les informations</button></div>
  </form></>
}

function ProductEditor({ product, categories, onClose, onSave, busy }) {
  const [preview, setPreview] = useState(product.image_url || '')
  return <div className="modal-backdrop admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="editor-modal product-editor" onSubmit={onSave}><div className="editor-header"><div><div className="eyebrow"><span /> {product.id ? 'MODIFIER LA CRÉATION' : 'NOUVELLE CRÉATION'}</div><h2>{product.id ? 'Un petit changement ?' : 'Ajoutez votre gâteau.'}</h2><p>Quelques détails, et votre gâteau est prêt à briller.</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button></div><div className="editor-body">
    <label className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) { const dt = new DataTransfer(); dt.items.add(file); event.currentTarget.querySelector('input[type=file]').files = dt.files; setPreview(URL.createObjectURL(file)) } }}>{preview ? <img className="upload-preview" src={preview} alt="Aperçu du gâteau" /> : <span className="upload-icon"><ImagePlus size={24} /></span>}<span><b>{preview ? 'Changer la photo' : 'Ajouter une jolie photo'}</b><small>JPG, PNG ou WebP · 5 Mo maximum</small></span><Upload size={17} /><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)) }} /></label>
    <label>Nom du gâteau<input className="form-input" name="name" required maxLength={100} defaultValue={product.name || ''} placeholder="Ex. Le Doux Passion" /></label>
    <div className="form-grid"><label>Prix (FCFA)<input className="form-input" name="price" required type="number" min="0" step="1" defaultValue={product.price ?? ''} placeholder="18000" /></label><label>Prix promotionnel (FCFA)<input className="form-input" name="promo_price" type="number" min="0" step="1" defaultValue={product.promo_price ?? ''} placeholder="Facultatif" /></label></div>
    <label>Description<textarea className="form-input" name="description" rows="3" maxLength={1000} defaultValue={product.description || ''} placeholder="Décrivez les saveurs et les ingrédients…" /></label>
    <label>Catégorie<select className="form-input" name="category_id" defaultValue={product.category_id || ''}><option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label>Adresse de la photo existante <small>(facultatif — utilisée si aucune nouvelle photo n’est envoyée)</small><input className="form-input" name="image_url" type="url" defaultValue={product.image_url || ''} placeholder="https://…" /></label>
    <label className="toggle-row editor-toggle"><span><b>Disponible à la commande</b><small>Les clients peuvent commander ce gâteau.</small></span><input type="checkbox" name="available" defaultChecked={product.available ?? true} /></label>
    </div><div className="editor-footer"><button type="submit" name="publish_intent" value="draft" className="button button-outline" disabled={busy}>Enregistrer comme brouillon</button><button className="button button-dark" type="submit" name="publish_intent" value="publish" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <>Publier <ArrowRight size={16} /></>}</button></div></form></div>
}

function PromotionEditor({ promotion, onClose, onSave }) {
  const [active, setActive] = useState(promotion.active ?? true)
  return <div className="modal-backdrop admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="editor-modal promotion-editor" onSubmit={onSave}><div className="editor-header"><div><div className="eyebrow"><span /> PROMOTION</div><h2>{promotion.id ? 'Modifier votre offre' : 'Une offre à partager.'}</h2><p>Mettez vos nouvelles gourmandises en lumière.</p></div><button type="button" className="modal-close" onClick={onClose}><X /></button></div><div className="editor-body"><label>Titre<input className="form-input" name="title" required defaultValue={promotion.title || ''} placeholder="Une petite douceur en plus" /></label><label>Description<textarea className="form-input" name="description" rows="4" required defaultValue={promotion.description || ''} placeholder="Décrivez votre promotion…" /></label><div className="form-grid"><label>Date de début<input className="form-input" name="starts_at" type="date" defaultValue={promotion.starts_at || ''} /></label><label>Date de fin<input className="form-input" name="ends_at" type="date" defaultValue={promotion.ends_at || ''} /></label></div><label className="toggle-row editor-toggle"><span><b>Promotion active</b><small>L’offre active apparaît sur la page d’accueil.</small></span><input name="active" type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /></label></div><div className="editor-footer"><button className="button button-outline" type="button" onClick={onClose}>Annuler</button><button className="button button-dark" type="submit">Enregistrer <ArrowRight size={16} /></button></div></form></div>
}

export default App
