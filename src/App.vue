<template>

    <swd-menu role="navigation">
      <RouterLink class="logo" :to="{ name: 'home' }">
        <img src="@/assets/logo.svg" height="25px">
        <div class="logo__seperator"></div>
        <div class="logo__client">
          <span class="accent-text">Gruppe</span>
          <span class="accent-text">Gailingen e.V.</span>
        </div>
      </RouterLink>
      <div class="menu">
        <RouterLink :to="{ name: 'home' }" :exact="false"><swd-icon class="home-icon"></swd-icon><span>Home</span></RouterLink>
        <RouterLink :to="{ name: 'plans' }" :class="{ 'router-link-active': $route.path.startsWith($router.resolve({ name: 'plans' }).path) }" :exact="false"><swd-icon class="calendar-icon"></swd-icon><span>Dienstpläne</span></RouterLink>
        <RouterLink :to="{ name: 'profile' }" :exact="false"><swd-icon class="user-icon"></swd-icon><span>Profil</span></RouterLink>
      </div>
    </swd-menu>

    <main>
      <RouterView />
    </main>

</template>

<style scoped>

swd-menu a, swd-menu a * {
  color: var(--theme-accent-color);
}

swd-menu a:hover, swd-menu a:hover *,
swd-menu a.router-link-active, swd-menu a.router-link-active * {
  color: white;
}

swd-menu a {
  display: flex;
  gap: 0.5em;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: auto;
  gap: 0 8px;

  & .logo__seperator {
    width: 2px;
    height: 30px;
    background: var(--theme-accent-color);
  }

  & .logo__client {
    display: flex;
    flex-direction: column;
    line-height: 15px;
    font-size: 12px;
    color: var(--theme-accent-color) !important;
    font-weight: bold;
  }

}

.menu {
  display: flex;
  align-items: center;
}

@media only screen and (max-width: 575px) {

  main {
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: calc(var(--theme-menu-height) + env(safe-area-inset-bottom, 0));
  }

  swd-menu {
    position: fixed;
    top: initial;
    bottom: 0;
    width: 100%;
    padding-bottom: env(safe-area-inset-bottom, 0);
    --theme-menu-height: 50px + env(safe-area-inset-bottom, 0);
  }

  swd-menu a {
    align-items: center;
    text-align: center;
    flex-direction: column;
  }

  swd-menu a span {
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

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>