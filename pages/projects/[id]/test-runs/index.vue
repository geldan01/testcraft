<script setup lang="ts">
const route = useRoute()
const projectId = route.params.id as string

await navigateTo(`/projects/${projectId}/runs`, { replace: true })
</script>
