<template>
    <div id="app">
        <!-- <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav> -->
        <router-view />
    </div>
</template>

<style lang="scss">
#app {
    //   font-family: Avenir, Helvetica, Arial, sans-serif;
    //   -webkit-font-smoothing: antialiased;
    //   -moz-osx-font-smoothing: grayscale;
    //   text-align: center;
    color: rgba($color: #000000, $alpha: 0.8);
    width: 100%;
    height: 100%;
    font-size: 16px;
}
</style>
