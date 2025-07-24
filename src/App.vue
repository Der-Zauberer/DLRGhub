<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="page">
    <nav>
      <div class="logo">
        <img src="@/assets/logo.svg" height="25px">
        <div class="logo__seperator"></div>
        <div class="logo__client">
          <span class="secondary-text">Gruppe</span>
          <span class="secondary-text">Gailingen e.V.</span>
        </div>
      </div>
      <div class="menu">
        <RouterLink class="button ghost" :to="{ name: 'home' }" :exact="false"><swd-icon class="home-icon"></swd-icon><span>Home</span></RouterLink>
        <RouterLink class="button ghost" :to="{ name: 'plans' }" :class="{ 'router-link-active': $route.path.startsWith($router.resolve({ name: 'plans' }).path) }" :exact="false"><swd-icon class="calendar-icon"></swd-icon><span>Dienstpläne</span></RouterLink>
        <RouterLink class="button ghost" :to="{ name: 'profile' }" :exact="false"><swd-icon class="user-icon"></swd-icon><span>Profil</span></RouterLink>
      </div>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>

.page {
  display: flex;
  flex-direction: column;
}

nav {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: var(--theme-menu-height);
  background-color: var(--theme-primary-color);
  padding: 0 round(0.6em, 1px);
}

nav a {
  text-decoration: none;
  --theme-element-primary-color: var(--theme-primary-color);
  --theme-element-secondary-color: var(--theme-primary-color);
}

nav a, nav a * {
  color: var(--theme-secondary-color);
}

nav a:hover, nav a:hover *,
nav a.router-link-active, nav a.router-link-active * {
  color: white;
}

nav a {
  display: flex;
  gap: 0.5em;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: auto;
}

.logo .logo__seperator {
  width: 2px;
  height: 30px;
  margin: 0 8px;
  background: var(--theme-secondary-color);
}

.logo .logo__client {
  display: flex;
  flex-direction: column;
  line-height: 15px;
  font-size: 12px;
  color: var(--theme-secondary-color) !important;
  font-weight: bold;
}

.menu {
  display: flex;
  align-items: center;
}

@media only screen and (max-width: 575px) {

  .page {
    flex-direction: column-reverse;
  }

  main {
    height: calc(100vh - var(--theme-menu-height));
    overflow-y: auto;
  }

  nav {
    top: calc(100vh - var(--theme-menu-height));
    bottom: 0;
    width: 100%;
  }

  nav a {
    align-items: center;
    text-align: center;
    flex-direction: column;
  }

  nav a span {
    line-height: 0.5em;
    font-size: 0.5em;
  }

  .logo {
    display: none;
  }

  .menu {
    width: 100%;
    justify-content: space-around;
  }

}

</style>
