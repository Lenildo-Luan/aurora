<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const colorMode = useColorMode()
const toast = useToast()

// Mobile menu state
const mobileMenuOpen = ref(false)

// User menu state
const userMenuOpen = ref(false)

// Navigation items
const navItems = [
  {
    label: 'Diário',
    to: '/journal',
    icon: 'i-heroicons-book-open',
    active: computed(() => route.path.startsWith('/journal'))
  },
  {
    label: 'Análises',
    to: '/analytics',
    icon: 'i-heroicons-chart-bar',
    active: computed(() => route.path.startsWith('/analytics'))
  },
  {
    label: 'Configurações',
    to: '/settings',
    icon: 'i-heroicons-cog-6-tooth',
    active: computed(() => route.path.startsWith('/settings'))
  }
]

// User menu items
const userMenuItems = [
  [{
    label: 'Perfil',
    icon: 'i-heroicons-user',
    click: () => router.push('/profile')
  }],
  [{
    label: 'Configurações',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => router.push('/settings')
  }],
  [{
    label: 'Sair',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: handleLogout
  }]
]

// Toggle dark mode
const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Handle logout
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    toast.add({
      title: 'Logout realizado',
      description: 'Até logo!',
      color: 'success'
    })
    
    router.push('/login')
  } catch (error: any) {
    toast.add({
      title: 'Erro ao fazer logout',
      description: error.message,
      color: 'error'
    })
  }
}

// Get user initials for avatar
const userInitials = computed(() => {
  if (!user.value?.email) return '?'
  return user.value.email.charAt(0).toUpperCase()
})

// Get user display name
const userDisplayName = computed(() => {
  if (!user.value) return 'Usuário'
  return user.value.user_metadata?.full_name || 
         user.value.email?.split('@')[0] || 
         'Usuário'
})

// Close mobile menu when route changes
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo & Brand -->
      <div class="brand">
        <NuxtLink to="/" class="brand-link">
          <div class="logo-wrapper">
            <UIcon name="i-heroicons-chart-bar" class="w-8 h-8" />
          </div>
          <span class="brand-text">
            Diário de Correlações
          </span>
        </NuxtLink>
      </div>

      <!-- Desktop Navigation -->
      <nav v-if="user" class="desktop-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'nav-link',
            item.active.value ? 'nav-link-active' : ''
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Right Section -->
      <div class="header-actions">
        <!-- New Entry Button (Desktop) -->
        <UButton
          v-if="user && route.path.startsWith('/journal')"
          @click="router.push('/journal/new')"
          icon="i-heroicons-plus"
          class="hidden md:flex"
        >
          Nova Entrada
        </UButton>

        <!-- Dark Mode Toggle -->
        <UButton
          @click="toggleDarkMode"
          :icon="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
          variant="ghost"
          size="lg"
        />

        <!-- Logout Button (Desktop - Visible) -->
        <UButton
          v-if="user"
          @click="handleLogout"
          icon="i-heroicons-arrow-right-on-rectangle"
          variant="ghost"
          size="lg"
          class="hidden lg:flex"
          title="Sair"
        />

        <!-- User Menu (Desktop) -->
        <UDropdown
          v-if="user"
          :items="userMenuItems"
          :popper="{ placement: 'bottom-end' }"
          class="hidden md:block"
        >
          <UButton
            variant="ghost"
            size="lg"
            class="user-menu-button"
          >
            <div class="user-avatar">
              {{ userInitials }}
            </div>
            <span class="user-name">{{ userDisplayName }}</span>
            <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
          </UButton>
        </UDropdown>

        <!-- Login Button (if not logged in) -->
        <UButton
          v-if="!user"
          @click="router.push('/login')"
          icon="i-heroicons-arrow-right-on-rectangle"
          class="hidden md:flex"
        >
          Entrar
        </UButton>

        <!-- Mobile Menu Toggle -->
        <UButton
          v-if="user"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :icon="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
          variant="ghost"
          size="lg"
          class="md:hidden"
        />
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition name="slide-down">
      <div v-if="mobileMenuOpen && user" class="mobile-menu">
        <nav class="mobile-nav">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'mobile-nav-link',
              item.active.value ? 'mobile-nav-link-active' : ''
            ]"
          >
            <UIcon :name="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="mobile-divider"></div>

        <!-- User Info -->
        <div class="mobile-user-info">
          <div class="user-avatar-large">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <p class="user-name-large">{{ userDisplayName }}</p>
            <p class="user-email">{{ user.email }}</p>
          </div>
        </div>

        <div class="mobile-divider"></div>

        <!-- Mobile Actions -->
        <div class="mobile-actions">
          <UButton
            v-if="route.path.startsWith('/journal')"
            @click="router.push('/journal/new')"
            icon="i-heroicons-plus"
            block
            size="lg"
          >
            Nova Entrada
          </UButton>

          <UButton
            @click="router.push('/settings')"
            icon="i-heroicons-cog-6-tooth"
            variant="outline"
            block
            size="lg"
          >
            Configurações
          </UButton>

          <UButton
            @click="handleLogout"
            icon="i-heroicons-arrow-right-on-rectangle"
            color="error"
            variant="outline"
            block
            size="lg"
          >
            Sair
          </UButton>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .app-header {
  background: rgba(17, 24, 39, 0.8);
  border-bottom-color: rgb(55 65 81);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Brand */
.brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  transition: opacity 0.2s;
}

.brand-link:hover {
  opacity: 0.8;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.brand-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: rgb(17 24 39);
  white-space: nowrap;
}

.dark .brand-text {
  color: white;
}

/* Desktop Navigation */
.desktop-nav {
  display: none;
  gap: 0.5rem;
  flex: 1;
}

@media (min-width: 768px) {
  .desktop-nav {
    display: flex;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(107 114 128);
  text-decoration: none;
  transition: all 0.2s;
}

.dark .nav-link {
  color: rgb(156 163 175);
}

.nav-link:hover {
  background: rgb(243 244 246);
  color: rgb(17 24 39);
}

.dark .nav-link:hover {
  background: rgb(55 65 81);
  color: white;
}

.nav-link-active {
  background: rgb(239 246 255);
  color: rgb(59 130 246);
}

.dark .nav-link-active {
  background: rgb(30 58 138);
  color: rgb(147 197 253);
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.user-menu-button {
  gap: 0.5rem !important;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
  color: rgb(17 24 39);
}

.dark .user-name {
  color: white;
}

/* Mobile Menu */
.mobile-menu {
  border-top: 1px solid rgb(229 231 235);
  background: white;
  padding: 1rem;
}

.dark .mobile-menu {
  border-top-color: rgb(55 65 81);
  background: rgb(17 24 39);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  color: rgb(107 114 128);
  text-decoration: none;
  transition: all 0.2s;
}

.dark .mobile-nav-link {
  color: rgb(156 163 175);
}

.mobile-nav-link:active {
  background: rgb(243 244 246);
}

.dark .mobile-nav-link:active {
  background: rgb(55 65 81);
}

.mobile-nav-link-active {
  background: rgb(239 246 255);
  color: rgb(59 130 246);
}

.dark .mobile-nav-link-active {
  background: rgb(30 58 138);
  color: rgb(147 197 253);
}

.mobile-divider {
  height: 1px;
  background: rgb(229 231 235);
  margin: 1rem 0;
}

.dark .mobile-divider {
  background: rgb(55 65 81);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
}

.user-avatar-large {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name-large {
  font-weight: 600;
  color: rgb(17 24 39);
  margin-bottom: 0.125rem;
}

.dark .user-name-large {
  color: white;
}

.user-email {
  font-size: 0.875rem;
  color: rgb(107 114 128);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .user-email {
  color: rgb(156 163 175);
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .brand-text {
    display: none;
  }
  
  .header-container {
    padding: 0.75rem 1rem;
  }
}
</style>