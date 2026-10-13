<script setup lang="ts">
import type { BackgroundData } from '@/lib/background'
import { useQuery } from '@tanstack/vue-query'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import ThumbnailCard from '@/components/ThumbnailCard.vue'
import { groupByDate, parseBackgroundList } from '@/lib/background'
import 'photoswipe/style.css'

let lightbox: PhotoSwipeLightbox | null = null
const apiBase = import.meta.env.VITE_API_BASE || ''
const apiFallback = import.meta.env.VITE_API_BASE_FALLBACK || ''

const sources = [
  {
    title: '游戏背景',
    url: '/hyp_cn_games.json',
  },
  {
    title: '启动器背景',
    url: '/hyp_cn_game_basic_info.json',
  },
  {
    title: '游戏背景(HoYoPlay)',
    url: '/hyp_os_games.json',
  },
  {
    title: '启动器背景(HoYoPlay)',
    url: '/hyp_os_game_basic_info.json',
  },
]

const categories = [
  {
    name: '崩坏3',
    key: 'bh3',
  },
  {
    name: '原神',
    key: 'hk4e',
  },
  {
    name: '崩坏：星穹铁道',
    key: 'hkrpg',
  },
  {
    name: '绝区零',
    key: 'nap',
  },
  {
    name: '星布谷地',
    key: 'hyg',
  },
  {
    name: '崩坏：因缘精灵',
    key: 'abc',
  },
]

const selectedCategory = ref<string | null>(null)
const currentSource = ref(0)

const { data: queryData, isLoading, isError, error } = useQuery({
  queryKey: computed(() => ['backgrounds', currentSource.value]),
  queryFn: async () => {
    const url = sources[currentSource.value]!.url

    try {
      return { items: await fetchBackgroundData(url, false), usingFallback: false }
    }
    catch (err) {
      if (!apiFallback)
        throw err

      console.warn('主数据源获取失败，尝试使用备用源', err)
      return { items: await fetchBackgroundData(url, true), usingFallback: true }
    }
  },
  staleTime: Infinity,
})

const usingFallback = computed(() => queryData.value?.usingFallback ?? false)

const backgroundGroups = computed(() => {
  if (!queryData.value)
    return []

  return groupByDate(queryData.value.items.filter((item) => {
    if (selectedCategory.value)
      return item.category.startsWith(selectedCategory.value)

    return true
  }))
})

async function fetchBackgroundData(url: string, useFallback = false): Promise<BackgroundData[]> {
  const baseUrl = useFallback ? apiFallback : apiBase
  const response = await fetch(baseUrl + url)

  if (!response.ok)
    throw new Error(`HTTP error! status: ${response.status}`)

  return parseBackgroundList(await response.json()).reverse()
}

function handleCategoryClick(categoryKey: string) {
  selectedCategory.value = selectedCategory.value === categoryKey ? null : categoryKey
}

function openUrl(url: string) {
  window.open(url, '_blank')
}

onMounted(() => {
  if (!lightbox) {
    lightbox = new PhotoSwipeLightbox({
      gallery: '#gallery',
      children: 'a.image',
      pswpModule: () => import('photoswipe'),

      arrowPrev: true,
      arrowNext: true,
    })
    lightbox.on('uiRegister', () => {
      lightbox!.pswp!.ui!.registerElement({
        name: 'download-button',
        order: 8,
        isButton: true,
        tagName: 'a',

        html: {
          isCustomSVG: true,
          inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
          outlineID: 'pswp__icn-download',
        },

        onInit: (el, pswp) => {
          el.setAttribute('download', '')
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noopener')

          pswp.on('change', () => {
            (el as HTMLLinkElement).href = pswp.currSlide?.data.src || ''
          })
        },
      })
    })
    lightbox.init()
  }
})
</script>

<template>
  <div class="p-4 sm:p-8">
    <div class="flex gap-x-4 gap-y-2 flex-wrap mb-4">
      <button
        v-for="item, index in sources" :key="item.url"
        class="px-4 py-2 border border-gray-300 rounded-lg transition-colors"
        :class="{
          'bg-gray-300': currentSource === index,
          'hover:bg-gray-100 cursor-pointer': currentSource !== index,
        }"
        @click="currentSource = index"
      >
        {{ item.title }}
      </button>
      <button
        class="px-4 py-2 border border-gray-300 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"

        @click="openUrl('https://github.com/orilights/hoyoplay-background')"
      >
        Github
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <div
        v-for="category in categories"
        :key="category.key"
        class="flex items-center gap-2 p-2 active:scale-95 rounded-lg transition-all cursor-pointer"
        :class="{
          'bg-gray-200': selectedCategory === category.key,
          'hover:bg-gray-100': selectedCategory !== category.key,
        }"
        @click="handleCategoryClick(category.key)"
      >
        <img class="size-6" :src="`/images/${category.key}.png`" :alt="category.name">
        {{ category.name }}
        <svg
          v-if="selectedCategory === category.key"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>
    </div>

    <div
      v-if="usingFallback"
      class="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800"
    >
      ⚠️ 当前正在使用备用数据源，可能存在更新延迟，如有疑问请前往 Github 反馈
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-600 mb-4" />
        <p class="text-gray-600">
          加载中...
        </p>
      </div>
    </div>

    <div
      v-else-if="isError"
      class="p-4 bg-red-50 border border-red-300 rounded-lg text-red-800"
    >
      <p class="font-bold mb-2">
        ❌ 数据加载失败，请检查网络，如有疑问请前往 Github 反馈
      </p>
      <p class="text-sm">
        {{ error?.message || '未知错误' }}
      </p>
    </div>

    <div id="gallery">
      <div v-for="group in backgroundGroups" :key="`${currentSource}-${group.groupName}`">
        <h2 class="text-2xl font-bold my-4">
          {{ group.groupName }}
        </h2>
        <div class="flex gap-4 flex-wrap">
          <ThumbnailCard
            v-for="item in group.list"
            :key="item.url"
            :data="item"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
