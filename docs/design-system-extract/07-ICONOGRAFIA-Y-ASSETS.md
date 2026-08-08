# 07 — Iconografía y assets

## Librería de íconos

| Aspecto | Valor |
|---------|-------|
| Librería principal | `react-icons` |
| Sets usados | Font Awesome (`fa`), Material (`md`), Google (`fc`) |
| Registry interno | `components/Icons.tsx` (~269 líneas) |
| Default size | **18** |
| API wrapper | `{ size?, color?, className?, onClick? }` → `currentColor` default |
| Custom SVGs en registry | `IconDismiss`, `IconShorts`, `IconFilterFunnel`, `IconFilterSliders`, `IconAdis`, QR vía componente |
| Extra custom | `components/icons/QrMinimalIcon.tsx` |
| No usados | lucide-react, heroicons, phosphor |

**Deuda:** ~25 archivos importan `react-icons` **directamente**, saltándose el registry.

---

## Catálogo del registry (grupos)

### Navegación / UI base
`IconClose`, `IconX`, `IconArrowLeft/Right`, `IconChevron*`, `IconSearch`, `IconCheck`, `IconVerified`, `IconClock`, `IconCalendar`, `IconLocation` / `IconMapMarkerAlt`, `IconEye`, `IconHome`, `IconExplore`, `IconMessages`, `IconSettings`, `IconSignOut`, `IconPlus`, `IconMinimize`, `IconExpand`

### Acciones
`IconCopy`, `IconShare` / `IconShareAlt`, `IconSend`, `IconBell`, `IconEdit`, `IconTrash`, `IconExternalLink`, `IconHeart` / `IconHeartOutline`, `IconDismiss`, `IconUpload`, `IconFilter*`, `IconSparkles`, `IconMicrophone`, `IconCamera`, `IconImage`, `IconVideo`, `IconFile*`

### Usuario / roles
`IconUser`, `IconUserPlus`, `IconUserCheck`, `IconOwner`, `IconBusinessAdmin`, `IconEditor`, `IconInfluencer`

### Tema
`IconMoon`, `IconSun`

### Categorías marketplace
`IconEmpleos`, `IconInmuebles`, `IconVehiculos`, `IconServicios`, `IconProductos`, `IconEventos`, `IconNegocios`, `IconComunidad`, `IconTodos`, `IconGratuitos`, `IconStore`, `IconBox` / `IconPackage`, `IconMegaphone`

### Social / contacto
`IconWhatsapp` / `IconWhatsApp`, `IconInstagram`, `IconFacebook`, `IconTiktok`, `IconLinkedin`, `IconYoutube`, `IconGlobe`, `IconEnvelope`, `IconPhone`

### Vistas
`IconGrid`, `IconList`, `IconFeed`, `IconShorts`, `IconTable`

### Marca / trust / misc
`IconAdis` (= chatbot), `IconChatbot`, `IconShield`, `IconMedal`, `IconQrcode`, `IconGoogle`, `IconGoogleLens`, `IconMotorcycle`, `IconStar`, `IconRobot`, `IconMap`, `IconMapPin`, `IconTitle`, `IconDescription`

---

## Assets de marca (`public/`)

### Logos
| Archivo | Notas |
|---------|-------|
| `logo.png` | Usado en Header |
| `logo.svg` | ~3MB — revisar optimización |
| `logov2.png` / `logov2.svg` | Variante |

### PWA / favicons
- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`, `android-chrome-512x512.png`
- `manifest.json`, `site.webmanifest` — `theme_color: #38bdf8` ⚠️

### Social / SEO
- `og-image.jpg`
- `og/categories/*.png` (una por categoría)

### QR
- `qr/buscadis-finder-mark.svg`

### Demos / tenants
- `cristalimag/images/` — catálogo vidrio/aluminio + logo
- `villachaco/images/` — café/chocolate + `logo-villa-chaco.*`

### Estilo ilustrativo
- Marketplace: fotos de usuario + placeholders tintados por categoría  
- Atmósfera: mesh gradients (no ilustraciones vectoriales de marca)  
- Demos: fotografía de producto / local  

---

## Recomendaciones para DS nuevo

1. Elegir **una** familia (lucide o set custom stroke 1.5/2) y migrar registry  
2. Tamaños tipados: 16 / 20 / 24 / 32  
3. Optimizar `logo.svg`; definir clear-space y versiones light/dark  
4. Alinear `theme_color` PWA con marca canónica  
5. Documentar mark QR como asset de sistema
