---
name: EstateDesk Design System
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#434842'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#747872'
  outline-variant: '#c3c8c0'
  surface-tint: '#516352'
  primary: '#4e604f'
  on-primary: '#ffffff'
  primary-container: '#677967'
  on-primary-container: '#f7fff3'
  inverse-primary: '#b8ccb7'
  secondary: '#5a605b'
  on-secondary: '#ffffff'
  secondary-container: '#dbe1db'
  on-secondary-container: '#5e6460'
  tertiary: '#72545b'
  on-tertiary: '#ffffff'
  tertiary-container: '#8c6c73'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e8d2'
  primary-fixed-dim: '#b8ccb7'
  on-primary-fixed: '#0f1f12'
  on-primary-fixed-variant: '#3a4b3b'
  secondary-fixed: '#dee4de'
  secondary-fixed-dim: '#c2c8c2'
  on-secondary-fixed: '#171d19'
  on-secondary-fixed-variant: '#424844'
  tertiary-fixed: '#ffd9e0'
  tertiary-fixed-dim: '#e3bdc4'
  on-tertiary-fixed: '#2b151b'
  on-tertiary-fixed-variant: '#5b3f46'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is anchored in a "Content-First" philosophy, drawing heavy inspiration from Notion-like minimalism to support Turkish real estate agents in high-focus tasks. The brand personality is **calm, professional, and breathable**, prioritizing legibility and ease of navigation over visual flair. 

The aesthetic blends **Minimalism** with **Modern Corporate** sensibilities. It avoids "loud" UI elements, opting instead for a subdued color palette and generous white space to reduce cognitive load. The emotional response should be one of "Huzur" (Serenity) and "Güven" (Trust), ensuring that the agent feels in control of complex data.

## Colors
The palette is built on a foundation of **#FAFAF8 (Warm White)**, providing a softer, more organic feel than pure clinical white. 

- **Primary (Adaçayı):** #7D907D is used for primary actions, active states, and brand markers. It evokes growth and stability.
- **Secondary:** A lighter tint of sage for hover states and subtle highlights.
- **Neutral/Background:** The primary canvas color.
- **Surface:** Pure white is reserved for cards, modals, and input fields to create a clear "layer" above the warm background.
- **Text:** Deep charcoal (#2D2D2D) provides high contrast without the harshness of pure black.

## Typography
This design system utilizes **Inter** exclusively to maintain a systematic, utilitarian aesthetic. The type scale is designed with generous line heights to enhance readability during long periods of data entry and property review.

- **Başlıklar (Headlines):** Slightly tighter letter spacing for a modern, "tucked-in" look.
- **Gövde Metni (Body):** High line-height (1.5x minimum) to ensure "breathability."
- **Etiketler (Labels):** Used for metadata (e.g., "İlan Durumu", "Fiyat").
- **Language Support:** Full support for Turkish characters (ğ, ü, ş, ı, ö, ç) is mandatory; Inter handles these natively with consistent vertical alignment.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The main content area behaves like a document (fixed max-width of 1200px) centered on the screen, while navigation sidebars remain fluid.

- **Grid:** A 12-column grid is used for property listings and dashboards.
- **Spacing Rhythm:** Based on an 8px base unit. 
- **Internal Padding:** Large cards should use 32px (stack-lg) padding to maintain the "breathable" feel.
- **Mobile Adaptation:** At the 768px breakpoint, margins shrink to 16px and columns stack vertically. The sidebar transitions to a bottom navigation bar or a hidden drawer.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Soft Ambient Shadows** rather than heavy borders.

- **Level 0 (Base):** The #FAFAF8 background.
- **Level 1 (Surface):** Cards and white containers. Use a very subtle 1px border (#E5E5E1) and a soft shadow (0px 2px 4px rgba(0,0,0,0.02)).
- **Level 2 (Interaction):** Modals and dropdowns. These feature a more pronounced shadow (0px 12px 24px rgba(0,0,0,0.05)) to signify temporary overlay.
- **Notion-style Dividers:** Use thin, 1px horizontal lines in #E5E5E1 to separate sections within a single surface, avoiding visual clutter.

## Shapes
The shape language is consistently **Rounded (Level 2)**. 

- **Containers & Cards:** 12px (0.75rem) corner radius.
- **Buttons & Inputs:** 8px (0.5rem) corner radius for a precise but friendly feel.
- **Search Bars:** Can utilize 24px (1.5rem) to distinguish them from standard form fields.
The goal is to remove sharp edges that feel aggressive, reinforcing the "calm" brand attribute.

## Components

### Butonlar (Buttons)
- **Primary:** Sage background, white text. No gradients.
- **Secondary:** Transparent background, Sage border (1px), Sage text.
- **Ghost:** Minimal padding, Sage text, no border. Used for "İptal" (Cancel) or secondary actions.

### Girdi Alanları (Input Fields)
- Background: #FFFFFF.
- Border: 1px solid #E5E5E1. 
- On Focus: Border changes to #7D907D with a subtle 2px outer glow in the same color at 10% opacity.
- Placeholder text: Soft grey (#A0A09A).

### Kartlar (Cards - Property Listings)
- Property cards should feature a large image with a 12px radius. 
- Title (Headline-MD) and Price (Sage Green color) should be prominent.
- Metadata (m², Oda Sayısı) uses `label-sm` with subtle icons.

### Çipler (Chips/Tags)
- Used for "Satılık" (For Sale), "Kiralık" (For Rent), or "Arşivlendi" (Archived).
- Backgrounds should be very desaturated versions of status colors (e.g., light red for "Sold") to keep the UI quiet.

### Listeler (Lists)
- Notion-style toggle lists for property features and client notes.
- Row hover state: #F5F5F2.