import { FireRoamApp } from './core/app';
import { toast } from './ui/components';

const container = document.getElementById('app')!;
const app = new FireRoamApp(container);

app.start().catch((err: unknown) => {
  console.error(err);
  toast(`初始化失败:${err instanceof Error ? err.message : String(err)}`, 6000);
});
