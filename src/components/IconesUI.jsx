import {
  ArrowRight,
  BarChart3,
  Bell,
  BellOff,
  Box,
  Check,
  Cloud,
  Contrast,
  Copy,
  Download,
  Eye,
  EyeOff,
  Gamepad2,
  Gauge,
  Home,
  LayoutGrid,
  Lock,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Star,
  Trash2,
  Type,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

function makeIcon(LucideComp) {
  return function WrappedIcon({ size = 18, className = "", ...rest }) {
    return (
      <LucideComp
        size={size}
        strokeWidth={2}
        className={className}
        aria-hidden="true"
        {...rest}
      />
    );
  };
}

export const IconVozOn = makeIcon(Volume2);
export const IconVozOff = makeIcon(VolumeX);
export const IconAjustes = makeIcon(SlidersHorizontal);
export const IconSair = makeIcon(LogOut);
export const IconUsuario = makeIcon(User);
export const IconGamepad = makeIcon(Gamepad2);
export const IconBlocos = makeIcon(LayoutGrid);
export const IconCriancas = makeIcon(Users);
export const IconGrafico = makeIcon(BarChart3);
export const IconFonte = makeIcon(Type);
export const IconContraste = makeIcon(Contrast);
export const IconNuvemCalma = makeIcon(Cloud);
export const IconSinoOn = makeIcon(Bell);
export const IconSinoOff = makeIcon(BellOff);
export const IconVelocidade = makeIcon(Gauge);
export const IconEstrela = makeIcon(Star);
export const IconOlhoAberto = makeIcon(Eye);
export const IconOlhoFechado = makeIcon(EyeOff);
export const IconCasa = makeIcon(Home);
export const IconCheck = makeIcon(Check);
export const IconCadeado = makeIcon(Lock);
export const IconFechar = makeIcon(X);
export const IconMais = makeIcon(Plus);
export const IconChacoalhar = makeIcon(RefreshCw);
export const IconCubo = makeIcon(Box);
export const IconQuadrado = makeIcon(Square);
export const IconReiniciar = makeIcon(RotateCcw);
export const IconEditar = makeIcon(Pencil);
export const IconLixeira = makeIcon(Trash2);
export const IconCopiar = makeIcon(Copy);
export const IconImprimir = makeIcon(Printer);
export const IconDownload = makeIcon(Download);
export const IconEnviar = makeIcon(Send);
export const IconFala = makeIcon(MessageCircle);
export const IconSetaDireita = makeIcon(ArrowRight);
export const IconEscudo = makeIcon(ShieldCheck);
