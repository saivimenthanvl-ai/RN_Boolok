import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, Modal, useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, typography } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type PlotShape = 'rectangular' | 'square' | 'l-shaped' | 'irregular';
type FacingDir = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';
type Stories = 1 | 2 | 3 | 4;
type DiningOpt = 'separate' | 'open' | 'in_kitchen' | 'none';
type BathPref = 'attached' | 'shared' | 'mix';
type KitchenType = 'closed' | 'open' | 'island' | 'semi-open';
type ParkingType = 'open' | 'covered' | 'garage' | 'stilt';
type StairLoc = 'center' | 'side' | 'entrance' | 'external';
type StairWidth = 'standard' | 'comfortable' | 'wide';
type StairShape = 'straight' | 'l-shaped' | 'u-shaped' | 'spiral';
type VastuStrict = 'strict' | 'balanced' | 'flexible';
type ArchStyle = 'traditional' | 'contemporary' | 'eco' | 'mediterranean' | 'minimalist';
type FinishQ = 'economy' | 'standard' | 'premium' | 'luxury';
type WinPref = 'large' | 'moderate' | 'small';
type SiteSlope = 'flat' | 'toward_road' | 'away_road' | 'side';
type ExistFeat = 'borewell' | 'septic_tank' | 'trees' | 'old_structure' | 'water_tank' | 'electric_pole' | 'drainage';

interface FormData {
  // Step 1
  plotWidth: number;
  plotDepth: number;
  plotUnit: 'feet' | 'meters';
  plotShape: PlotShape;
  plotShapeDesc: string;
  facing: FacingDir;
  roadAccess: string[];
  roadWidth: number;
  // Step 2
  adults: number;
  children: number;
  elders: number;
  pets: boolean;
  domesticHelp: boolean;
  servantQuarter: boolean;
  guestFreq: 'rarely' | 'occasionally' | 'frequently';
  cars: number;
  bikes: number;
  // Step 3
  stories: Stories;
  bedrooms: number;
  mbAttachedBath: boolean;
  mbWardrobe: boolean;
  mbStudy: boolean;
  mbBalcony: boolean;
  bathPref: BathPref;
  livingRoom: boolean;
  dining: DiningOpt;
  poojaRoom: boolean;
  study: boolean;
  storeRoom: boolean;
  balconies: number;
  terraceAccess: boolean;
  // Step 4
  kitchenType: KitchenType;
  kitchenFeatures: string[];
  diningCapacity: '4' | '6' | '8' | '10+';
  // Step 5
  carParking: boolean;
  parkingType: ParkingType;
  // Step 6
  stairLoc: StairLoc;
  stairWidth: StairWidth;
  stairShape: StairShape;
  // Step 7
  vastuEnabled: boolean;
  vastuStrictness: VastuStrict;
  vastuReqs: string[];
  // Step 8
  archStyle: ArchStyle;
  finish: FinishQ;
  windowPref: WinPref;
  futureExpansion: boolean;
  // Step 9
  existingFeatures: { feature: ExistFeat; location: string }[];
  neighborSides: string[];
  siteSlope: SiteSlope;
  // Step 10
  specialNotes: string;
  avoidNotes: string;
}

const DEFAULTS: FormData = {
  plotWidth: 30, plotDepth: 40, plotUnit: 'feet', plotShape: 'rectangular',
  plotShapeDesc: '', facing: 'north', roadAccess: ['front'], roadWidth: 20,
  adults: 2, children: 0, elders: 0, pets: false, domesticHelp: false,
  servantQuarter: false, guestFreq: 'rarely', cars: 1, bikes: 1,
  stories: 1, bedrooms: 2, mbAttachedBath: true, mbWardrobe: false,
  mbStudy: false, mbBalcony: false, bathPref: 'attached', livingRoom: true,
  dining: 'separate', poojaRoom: false, study: false, storeRoom: true,
  balconies: 1, terraceAccess: false,
  kitchenType: 'closed', kitchenFeatures: [], diningCapacity: '6',
  carParking: true, parkingType: 'covered',
  stairLoc: 'side', stairWidth: 'comfortable', stairShape: 'straight',
  vastuEnabled: false, vastuStrictness: 'balanced', vastuReqs: [],
  archStyle: 'contemporary', finish: 'standard', windowPref: 'large', futureExpansion: false,
  existingFeatures: [], neighborSides: [], siteSlope: 'flat',
  specialNotes: '', avoidNotes: '',
};

// ─── Tiny UI Components ───────────────────────────────────────────────────────

function Toggle({ value, onToggle, label, sub, theme }: any) {
  return (
    <Pressable onPress={() => onToggle(!value)} style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: theme.onSurface }]}>{label}</Text>
        {sub && <Text style={[styles.toggleSub, { color: theme.onSurfaceVariant }]}>{sub}</Text>}
      </View>
      <View style={[styles.trackOuter, { backgroundColor: value ? theme.primary : theme.outlineVariant }]}>
        <View style={[styles.trackThumb, { left: value ? 22 : 4 }]} />
      </View>
    </Pressable>
  );
}

function Stepper({ value, onChange, min = 0, max = 99, label, sub, theme }: any) {
  return (
    <View style={styles.stepperRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: theme.onSurface }]}>{label}</Text>
        {sub && <Text style={[styles.toggleSub, { color: theme.onSurfaceVariant }]}>{sub}</Text>}
      </View>
      <View style={styles.stepperBtns}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={({ pressed }) => [styles.stepBtn, { borderColor: theme.outlineVariant, opacity: value <= min ? 0.3 : pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="remove" size={16} color={theme.primary} />
        </Pressable>
        <Text style={[styles.stepValue, { color: theme.onSurface }]}>{value}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={({ pressed }) => [styles.stepBtn, { borderColor: theme.outlineVariant, opacity: value >= max ? 0.3 : pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="add" size={16} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function SegCtrl({ value, onChange, options, theme }: any) {
  return (
    <View style={[styles.segCtrl, { backgroundColor: theme.surfaceContainer }]}>
      {options.map((opt: any) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)}
            style={[styles.segBtn, active && { backgroundColor: theme.surfaceContainerLowest }]}>
            <Text style={[styles.segText, { color: active ? theme.primary : theme.onSurfaceVariant, fontWeight: active ? '700' : '500' }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RadioCard({ value, current, onPress, label, icon, sub, theme }: any) {
  const active = value === current;
  return (
    <Pressable onPress={() => onPress(value)}
      style={[styles.radioCard, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.08)' : theme.surfaceContainerLowest }]}>
      {icon && <Text style={styles.cardIcon}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardLabel, { color: active ? theme.primary : theme.onSurface }]}>{label}</Text>
        {sub && <Text style={[styles.cardSub, { color: theme.onSurfaceVariant }]}>{sub}</Text>}
      </View>
      <View style={[styles.radioDot, { borderColor: active ? theme.primary : theme.outline }]}>
        {active && <View style={[styles.radioDotInner, { backgroundColor: theme.primary }]} />}
      </View>
    </Pressable>
  );
}

function ChipCard({ value, active, onToggle, label, icon, theme }: any) {
  return (
    <Pressable onPress={() => onToggle(value)}
      style={[styles.chipCard, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.08)' : theme.surfaceContainerLowest }]}>
      {icon && <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>}
      <Text style={[styles.chipLabel, { color: active ? theme.primary : theme.onSurface }]}>{label}</Text>
      {active && <View style={[styles.chipCheck, { backgroundColor: theme.primary }]}>
        <MaterialIcons name="check" size={10} color={theme.onPrimary} />
      </View>}
    </Pressable>
  );
}

function SectionHead({ icon, step, title, sub, badge, theme }: any) {
  return (
    <View style={styles.sectionHead}>
      <LinearGradient colors={['#DAA520', '#F59E0B']} style={styles.sectionIcon}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.stepTag, { color: theme.primary }]}>STEP {String(step).padStart(2, '0')}</Text>
          {badge && <View style={[styles.badge, { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant }]}>
            <Text style={[styles.badgeText, { color: theme.onSurfaceVariant }]}>{badge}</Text>
          </View>}
        </View>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>{title}</Text>
        {sub && <Text style={[styles.sectionSub, { color: theme.onSurfaceVariant }]}>{sub}</Text>}
      </View>
    </View>
  );
}

function Warn({ type, msg, theme }: any) {
  const colors = { error: '#ef4444', warning: '#f59e0b', info: theme.primary, success: '#16a34a' };
  const icons = { error: 'error', warning: 'warning', info: 'info', success: 'check-circle' };
  const bgs = { error: 'rgba(239,68,68,0.08)', warning: 'rgba(245,158,11,0.08)', info: 'rgba(218,165,32,0.08)', success: 'rgba(22,163,74,0.08)' };
  return (
    <View style={[styles.warn, { backgroundColor: bgs[type as keyof typeof bgs], borderColor: colors[type as keyof typeof colors] + '40' }]}>
      <MaterialIcons name={icons[type as keyof typeof icons] as any} size={14} color={colors[type as keyof typeof colors]} />
      <Text style={[styles.warnText, { color: colors[type as keyof typeof colors] }]}>{msg}</Text>
    </View>
  );
}

function Divider({ theme }: any) {
  return <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />;
}

function FieldLabel({ children, help, theme }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.fieldLabel, { color: theme.onSurface }]}>{children}</Text>
      {help && <Text style={[styles.fieldHelp, { color: theme.onSurfaceVariant }]}>{help}</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BlueprintScreen() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const [form, setForm] = useState<FormData>(DEFAULTS);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const upd = useCallback((key: keyof FormData, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  // 9 core steps matching the design system
  const allSteps = [
    { id: 0, label: 'Plot', icon: '📐', badge: 'Required' },
    { id: 1, label: 'Family', icon: '👨‍👩‍👧‍👦', badge: 'Required' },
    { id: 2, label: 'Rooms', icon: '🏠', badge: 'Required' },
    { id: 3, label: 'Kitchen', icon: '🍳', badge: 'Conditional' },
    { id: 4, label: 'Parking', icon: '🚗', badge: 'Optional' },
    { id: 5, label: 'Vastu', icon: '🧭', badge: 'Optional' },
    { id: 6, label: 'Style', icon: '🎨', badge: 'Optional' },
    { id: 7, label: 'Site', icon: '🗺️', badge: 'Optional' },
    { id: 8, label: 'Notes', icon: '📝', badge: 'Optional' },
  ];
  const activeSteps = allSteps;
  const totalSteps = activeSteps.length;
  const progress = (step + 1) * 10;

  const goNext = () => {
    if (step < totalSteps - 1) {
      setStep(s => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      setSubmitted(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };
  const goPrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // ─── JSON builder ──
  const buildJson = () => {
    const rooms: any[] = [];
    if (form.livingRoom) rooms.push({ type: 'living_room', quantity: 1 });
    rooms.push({ type: 'bedroom', quantity: form.bedrooms, master_features: { attached_bathroom: form.mbAttachedBath, walk_in_wardrobe: form.mbWardrobe, study_corner: form.mbStudy, balcony_access: form.mbBalcony } });
    rooms.push({ type: 'bathroom', preference: form.bathPref, quantity: form.bathPref === 'attached' ? form.bedrooms : Math.max(2, Math.ceil(form.bedrooms / 2)) });
    if (form.dining !== 'none') rooms.push({ type: 'dining', style: form.dining, capacity: form.diningCapacity });
    rooms.push({ type: 'kitchen', kitchen_type: form.kitchenType, features: form.kitchenFeatures });
    if (form.poojaRoom) rooms.push({ type: 'pooja_room' });
    if (form.study) rooms.push({ type: 'study' });
    if (form.storeRoom) rooms.push({ type: 'store_room' });
    if (form.balconies > 0) rooms.push({ type: 'balcony', quantity: form.balconies });
    if (form.carParking) rooms.push({ type: 'parking', parking_type: form.parkingType, cars: form.cars });
    if (form.domesticHelp && form.servantQuarter) rooms.push({ type: 'servant_quarter' });
    return {
      plot: { width: form.plotWidth, depth: form.plotDepth, unit: form.plotUnit, shape: form.plotShape, ...(form.plotShape === 'irregular' && { shape_description: form.plotShapeDesc }), facing: form.facing, road_access: form.roadAccess, road_width_front: form.roadWidth },
      family: { adults: form.adults, children: form.children, elders: form.elders, pets: form.pets, domestic_help: form.domesticHelp, frequent_guests: form.guestFreq, vehicles: { cars: form.cars, bikes: form.bikes } },
      requirements: { stories: form.stories, rooms, terrace_access: form.terraceAccess, ...(form.stories >= 2 && { staircase: { staircase_type: form.stairLoc, width: form.stairWidth, shape: form.stairShape } }) },
      vastu: form.vastuEnabled ? { enabled: true, strictness: form.vastuStrictness, specific_requirements: form.vastuReqs } : { enabled: false },
      style: { type: form.archStyle, finish: form.finish, window_preference: form.windowPref, future_expansion: form.futureExpansion },
      additional_notes: { special_requirements: form.specialNotes, things_to_avoid: form.avoidNotes },
    };
  };

  // ─── Step content renderer ──
  const renderStep = () => {
    const curId = activeSteps[step]?.id;

    // STEP 0 — Plot
    if (curId === 0) return (
      <View>
        <SectionHead icon="📐" step={1} title="Plot Information" sub="Dimensions, shape, orientation and road access." badge="Required" theme={theme} />
        <FieldLabel theme={theme}>Plot Dimensions <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextInput value={String(form.plotWidth)} onChangeText={v => upd('plotWidth', Number(v) || 0)} keyboardType="numeric" placeholder="Width" placeholderTextColor={theme.outline} style={[styles.input, { borderColor: theme.outlineVariant, color: theme.onSurface, backgroundColor: theme.surfaceContainerLowest }]} />
            <Text style={[styles.inputTag, { color: theme.onSurfaceVariant }]}>Width</Text>
          </View>
          <Text style={[styles.dimX, { color: theme.onSurfaceVariant }]}>×</Text>
          <View style={{ flex: 1 }}>
            <TextInput value={String(form.plotDepth)} onChangeText={v => upd('plotDepth', Number(v) || 0)} keyboardType="numeric" placeholder="Depth" placeholderTextColor={theme.outline} style={[styles.input, { borderColor: theme.outlineVariant, color: theme.onSurface, backgroundColor: theme.surfaceContainerLowest }]} />
            <Text style={[styles.inputTag, { color: theme.onSurfaceVariant }]}>Depth</Text>
          </View>
          <SegCtrl value={form.plotUnit} onChange={(v: any) => upd('plotUnit', v)} options={[{ value: 'feet', label: 'ft' }, { value: 'meters', label: 'm' }]} theme={theme} />
        </View>
        {form.plotWidth > 0 && form.plotDepth > 0 && <Text style={[styles.areaText, { color: theme.primary }]}>Area: {form.plotWidth * form.plotDepth} sq.{form.plotUnit === 'feet' ? 'ft' : 'm'}</Text>}
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Plot Shape <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <View style={styles.grid2}>
          {(['rectangular', 'square', 'l-shaped', 'irregular'] as PlotShape[]).map(s => (
            <ChipCard key={s} value={s} active={form.plotShape === s} onToggle={() => upd('plotShape', s)} label={s.charAt(0).toUpperCase() + s.slice(1)} icon={s === 'rectangular' ? '▬' : s === 'square' ? '■' : s === 'l-shaped' ? '⌐' : '⬟'} theme={theme} />
          ))}
        </View>
        {form.plotShape === 'irregular' && (
          <TextInput value={form.plotShapeDesc} onChangeText={v => upd('plotShapeDesc', v)} placeholder="Describe the shape briefly..." placeholderTextColor={theme.outline} multiline numberOfLines={2} style={[styles.textarea, { borderColor: theme.primary + '60', color: theme.onSurface, backgroundColor: 'rgba(218,165,32,0.05)' }]} />
        )}
        <Divider theme={theme} />
        <FieldLabel help="Stand at the road facing your plot — that direction is your plot facing." theme={theme}>Facing Direction <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <View style={styles.grid4}>
          {[{ v: 'north', i: '⬆️' }, { v: 'northeast', i: '↗️' }, { v: 'east', i: '➡️' }, { v: 'southeast', i: '↘️' }, { v: 'south', i: '⬇️' }, { v: 'southwest', i: '↙️' }, { v: 'west', i: '⬅️' }, { v: 'northwest', i: '↖️' }].map(({ v, i }) => {
            const active = form.facing === v;
            return (
              <Pressable key={v} onPress={() => upd('facing', v as FacingDir)} style={[styles.dirBtn, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.1)' : theme.surfaceContainerLowest }]}>
                <Text style={{ fontSize: 18 }}>{i}</Text>
                <Text style={[styles.dirLabel, { color: active ? theme.primary : theme.onSurfaceVariant }]}>{v.charAt(0).toUpperCase() + v.slice(1, 3)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Road Access <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <View style={styles.grid2}>
          {[{ v: 'front', l: 'Front (Main Road)' }, { v: 'back', l: 'Back' }, { v: 'left', l: 'Left Side' }, { v: 'right', l: 'Right Side' }].map(({ v, l }) => {
            const active = form.roadAccess.includes(v);
            const toggle = () => {
              const next = active ? form.roadAccess.filter(r => r !== v) : [...form.roadAccess, v];
              if (next.length > 0) upd('roadAccess', next);
            };
            return (
              <Pressable key={v} onPress={toggle} style={[styles.checkCard, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.08)' : theme.surfaceContainerLowest }]}>
                <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.outline, backgroundColor: active ? theme.primary : 'transparent' }]}>
                  {active && <MaterialIcons name="check" size={10} color={theme.onPrimary} />}
                </View>
                <Text style={[styles.checkLabel, { color: active ? theme.primary : theme.onSurface }]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>
        <Divider theme={theme} />
        <FieldLabel help="Needed to determine if car parking is feasible." theme={theme}>Front Road Width (feet)</FieldLabel>
        <TextInput value={String(form.roadWidth)} onChangeText={v => upd('roadWidth', Number(v) || 0)} keyboardType="numeric" placeholder="e.g. 20" placeholderTextColor={theme.outline} style={[styles.inputSm, { borderColor: theme.outlineVariant, color: theme.onSurface, backgroundColor: theme.surfaceContainerLowest }]} />
        {form.roadWidth > 0 && form.roadWidth < 12 && <Warn type="warning" msg="Narrow road (< 12ft) — car parking may be tight." theme={theme} />}
      </View>
    );

    // STEP 1 — Family
    if (curId === 1) return (
      <View>
        <SectionHead icon="👨‍👩‍👧‍👦" step={2} title="Family & Lifestyle" sub="Help us understand who will live in this home." badge="Required" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
          <Text style={[styles.cardGroupLabel, { color: theme.primary }]}>FAMILY MEMBERS</Text>
          <Stepper value={form.adults} onChange={(v: number) => upd('adults', v)} min={1} max={10} label="Adults (18+)" theme={theme} />
          <Divider theme={theme} />
          <Stepper value={form.children} onChange={(v: number) => upd('children', v)} min={0} max={8} label="Children (below 18)" theme={theme} />
          <Divider theme={theme} />
          <Stepper value={form.elders} onChange={(v: number) => upd('elders', v)} min={0} max={4} label="Elderly (65+)" theme={theme} />
          {form.elders > 0 && <Warn type="info" msg="We'll ensure a ground-floor bedroom for elderly accessibility." theme={theme} />}
          <Divider theme={theme} />
          <View style={styles.rowBetween}>
            <Text style={[styles.toggleLabel, { color: theme.onSurfaceVariant }]}>Total residents</Text>
            <Text style={[styles.totalBadge, { color: theme.primary }]}>{form.adults + form.children + form.elders} people</Text>
          </View>
        </View>
        <Divider theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, borderWidth: 1 }]}>
          <Toggle value={form.pets} onToggle={(v: boolean) => upd('pets', v)} label="Do you have pets?" sub="We'll plan for pet-friendly spaces or a yard." theme={theme} />
        </View>
        <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, borderWidth: 1, marginTop: 10 }]}>
          <Toggle value={form.domesticHelp} onToggle={(v: boolean) => upd('domesticHelp', v)} label="Domestic help / driver who needs space?" theme={theme} />
          {form.domesticHelp && (
            <View style={{ paddingLeft: 16, marginTop: 10, borderLeftWidth: 2, borderLeftColor: theme.primary + '40' }}>
              <Toggle value={form.servantQuarter} onToggle={(v: boolean) => upd('servantQuarter', v)} label="Include a servant quarter / driver room?" theme={theme} />
            </View>
          )}
        </View>
        <Divider theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
          <Text style={[styles.cardGroupLabel, { color: theme.primary }]}>VEHICLES</Text>
          <Stepper value={form.cars} onChange={(v: number) => { upd('cars', v); if (v === 0) upd('carParking', false); else upd('carParking', true); }} min={0} max={3} label="Cars" theme={theme} />
          <Divider theme={theme} />
          <Stepper value={form.bikes} onChange={(v: number) => upd('bikes', v)} min={0} max={5} label="Bikes / Scooters" theme={theme} />
        </View>
        <Divider theme={theme} />
        <FieldLabel help="Frequently = consider a dedicated guest bedroom." theme={theme}>How often do guests stay over?</FieldLabel>
        {[{ v: 'rarely', l: 'Rarely', s: 'On special occasions only' }, { v: 'occasionally', l: 'Occasionally', s: 'A few times a month' }, { v: 'frequently', l: 'Frequently', s: 'Often — consider a guest bedroom' }].map(({ v, l, s }) => (
          <RadioCard key={v} value={v} current={form.guestFreq} onPress={(val: any) => upd('guestFreq', val)} label={l} sub={s} theme={theme} />
        ))}
        {form.guestFreq === 'frequently' && <Warn type="info" msg="We'll plan for a dedicated guest bedroom or flexible study room." theme={theme} />}
      </View>
    );

    // STEP 2 — Rooms
    if (curId === 2) return (
      <View>
        <SectionHead icon="🏠" step={3} title="Room Requirements" sub="Define floors, bedrooms, bathrooms, and room types." badge="Required" theme={theme} />
        <FieldLabel theme={theme}>How many floors? <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <SegCtrl value={String(form.stories)} onChange={(v: string) => { const s = Number(v) as Stories; upd('stories', s); upd('terraceAccess', s >= 2); }} options={[{ value: '1', label: 'G only' }, { value: '2', label: 'G + 1' }, { value: '3', label: 'G + 2' }, { value: '4', label: 'G + 3' }]} theme={theme} />
        <Divider theme={theme} />
        <FieldLabel help={`Suggested for your family: ${Math.max(1, Math.ceil((form.adults + form.children) / 2))} bedrooms`} theme={theme}>Total Bedrooms <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
          <Stepper value={form.bedrooms} onChange={(v: number) => upd('bedrooms', v)} min={1} max={Math.min(8, form.stories * 4)} label="Bedrooms" theme={theme} />
        </View>
        {form.bedrooms > form.stories * 3 && <Warn type="error" msg={`Too many bedrooms for ${form.stories} floor(s). Max ~${form.stories * 3} recommended.`} theme={theme} />}
        {form.bedrooms >= 2 && (
          <>
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Master Bedroom Features</FieldLabel>
            <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, borderWidth: 1 }]}>
              {[{ k: 'mbAttachedBath' as const, l: 'Attached Bathroom' }, { k: 'mbWardrobe' as const, l: 'Walk-in Wardrobe' }, { k: 'mbStudy' as const, l: 'Study Corner' }, { k: 'mbBalcony' as const, l: 'Balcony Access' }].map(({ k, l }, i) => (
                <View key={k}>
                  {i > 0 && <Divider theme={theme} />}
                  <Toggle value={form[k] as boolean} onToggle={(v: boolean) => upd(k, v)} label={l} theme={theme} />
                </View>
              ))}
            </View>
          </>
        )}
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Bathroom Preference</FieldLabel>
        <RadioCard value="attached" current={form.bathPref} onPress={(v: any) => upd('bathPref', v)} label="Attached to every bedroom" sub="Each bedroom has its own bathroom" theme={theme} />
        <RadioCard value="shared" current={form.bathPref} onPress={(v: any) => upd('bathPref', v)} label="Shared / Common" sub="Bathrooms shared between rooms" theme={theme} />
        <RadioCard value="mix" current={form.bathPref} onPress={(v: any) => upd('bathPref', v)} label="Mix of both" sub="Master attached, rest shared" theme={theme} />
        <Text style={[styles.autoHint, { color: theme.onSurfaceVariant }]}>Auto-calc: {form.bathPref === 'attached' ? form.bedrooms : Math.max(2, Math.ceil(form.bedrooms / 2))} bathrooms</Text>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Rooms to Include</FieldLabel>
        <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, borderWidth: 1 }]}>
          {[{ k: 'livingRoom' as const, l: 'Living Room', s: 'Main lounge / drawing room' }, { k: 'poojaRoom' as const, l: 'Pooja / Prayer Room', s: 'Dedicated worship space' }, { k: 'study' as const, l: 'Study / Home Office', s: 'Work or study room' }, { k: 'storeRoom' as const, l: 'Store / Utility Room', s: 'Storage and utility area' }].map(({ k, l, s }, i) => (
            <View key={k}>
              {i > 0 && <Divider theme={theme} />}
              <Toggle value={form[k] as boolean} onToggle={(v: boolean) => upd(k, v)} label={l} sub={s} theme={theme} />
            </View>
          ))}
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Dining Space</FieldLabel>
        <View style={styles.grid2}>
          {[{ v: 'separate', l: 'Separate Dining', i: '🍽️' }, { v: 'open', l: 'Open Dining', i: '🪑' }, { v: 'in_kitchen', l: 'Dining in Kitchen', i: '🍳' }, { v: 'none', l: 'No Dedicated Dining', i: '🚫' }].map(({ v, l, i }) => (
            <ChipCard key={v} value={v} active={form.dining === v} onToggle={() => upd('dining', v as DiningOpt)} label={l} icon={i} theme={theme} />
          ))}
        </View>
        <Divider theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
          <Stepper value={form.balconies} onChange={(v: number) => upd('balconies', v)} min={0} max={4} label="Balconies" sub="Outdoor spaces from interior rooms" theme={theme} />
          {form.stories >= 2 && (
            <>
              <Divider theme={theme} />
              <Toggle value={form.terraceAccess} onToggle={(v: boolean) => upd('terraceAccess', v)} label="Terrace access from top floor?" sub="Open terrace via staircase" theme={theme} />
            </>
          )}
        </View>
        {form.stories >= 2 && (
          <>
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Staircase Location <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
            {[{ v: 'center', l: 'Center of House', s: 'Central, easily accessible', i: '🏛️' }, { v: 'side', l: 'Side / Corner', s: 'Tucked away, saves space', i: '📐' }, { v: 'entrance', l: 'Near Entrance', s: 'Visible from main door', i: '🚪' }, { v: 'external', l: 'External Staircase', s: 'Outside the building', i: '🏗️' }].map(({ v, l, s, i }) => (
              <RadioCard key={v} value={v} current={form.stairLoc} onPress={(val: any) => upd('stairLoc', val)} label={l} icon={i} sub={s} theme={theme} />
            ))}
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Staircase Width <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
            {[{ v: 'standard', l: 'Standard', s: '3 ft — minimum comfortable' }, { v: 'comfortable', l: 'Comfortable', s: '3.5 ft — recommended', tag: '⭐' }, { v: 'wide', l: 'Wide', s: '4+ ft — great for furniture' }].map(({ v, l, s }) => (
              <RadioCard key={v} value={v} current={form.stairWidth} onPress={(val: any) => upd('stairWidth', val)} label={l} sub={s} theme={theme} />
            ))}
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Staircase Shape <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
            <View style={styles.grid2}>
              {[{ v: 'straight', l: 'Straight', i: '↗' }, { v: 'l-shaped', l: 'L-Shaped', i: '⤴' }, { v: 'u-shaped', l: 'U-Shape', i: '⤵⤴' }, { v: 'spiral', l: 'Spiral 🌀', i: '🌀' }].map(({ v, l, i }) => (
                <ChipCard key={v} value={v} active={form.stairShape === v} onToggle={() => upd('stairShape', v as StairShape)} label={l} icon={i} theme={theme} />
              ))}
            </View>
            {form.stairShape === 'spiral' && form.elders > 0 && <Warn type="warning" msg="Spiral staircase not recommended with elderly residents. Consider straight or L-shaped." theme={theme} />}
            {form.stairShape === 'spiral' && <Warn type="info" msg="Spiral stairs look great but have a minimal footprint. Not ideal for carrying furniture." theme={theme} />}
          </>
        )}
      </View>
    );

    // STEP 4 — Kitchen
    if (curId === 3) return (
      <View>
        <SectionHead icon="🍳" step={4} title="Kitchen & Dining" sub="Kitchen layout, features, and dining capacity." badge="Conditional" theme={theme} />
        <FieldLabel theme={theme}>Kitchen Layout <Text style={{ color: theme.primary }}>*</Text></FieldLabel>
        <View style={styles.grid2}>
          {[{ v: 'closed', l: 'Closed Kitchen', i: '🚪', s: 'Separate enclosed' }, { v: 'open', l: 'Open Kitchen', i: '🍳', s: 'Open to living' }, { v: 'island', l: 'Island Kitchen', i: '🏝️', s: 'Center island' }, { v: 'semi-open', l: 'Semi-Open', i: '🪟', s: 'Partial partition' }].map(({ v, l, i, s }) => (
            <ChipCard key={v} value={v} active={form.kitchenType === v} onToggle={() => upd('kitchenType', v as KitchenType)} label={l} icon={i} theme={theme} />
          ))}
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Kitchen Features</FieldLabel>
        <View style={styles.grid2}>
          {['Modular cabinets', 'Double sink', 'Dishwasher space', 'Refrigerator nook', 'Chimney / hood', 'U-shaped counter', 'L-shaped counter'].map(feat => {
            const active = form.kitchenFeatures.includes(feat);
            return (
              <Pressable key={feat} onPress={() => { const next = active ? form.kitchenFeatures.filter(f => f !== feat) : [...form.kitchenFeatures, feat]; upd('kitchenFeatures', next); }} style={[styles.checkCard, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.08)' : theme.surfaceContainerLowest }]}>
                <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.outline, backgroundColor: active ? theme.primary : 'transparent' }]}>
                  {active && <MaterialIcons name="check" size={10} color={theme.onPrimary} />}
                </View>
                <Text style={[styles.checkLabel, { color: active ? theme.primary : theme.onSurface, fontSize: 12 }]}>{feat}</Text>
              </Pressable>
            );
          })}
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Dining Table Capacity</FieldLabel>
        <View style={styles.grid2}>
          {[{ v: '4', l: '4-Seater', i: '👥' }, { v: '6', l: '6-Seater', i: '👨‍👩‍👧‍👦' }, { v: '8', l: '8-Seater', i: '🎉' }, { v: '10+', l: '10+ Seater', i: '🏛️' }].map(({ v, l, i }) => (
            <ChipCard key={v} value={v} active={form.diningCapacity === v} onToggle={() => upd('diningCapacity', v as any)} label={l} icon={i} theme={theme} />
          ))}
        </View>
      </View>
    );

    // STEP 5 — Parking
    if (curId === 4) return (
      <View>
        <SectionHead icon="🚗" step={5} title="Parking & Vehicles" sub="Plan based on your vehicle count and site access." badge="Optional" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
          <Stepper value={form.cars} onChange={(v: number) => { upd('cars', v); if (v === 0) upd('carParking', false); }} min={0} max={3} label="Cars" theme={theme} />
          <Divider theme={theme} />
          <Stepper value={form.bikes} onChange={(v: number) => upd('bikes', v)} min={0} max={5} label="Bikes / Scooters" theme={theme} />
        </View>
        <Divider theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, borderWidth: 1 }]}>
          <Toggle value={form.carParking} onToggle={(v: boolean) => upd('carParking', v)} label="Need covered car parking?" sub="Include dedicated parking in your plan" theme={theme} />
        </View>
        {form.cars === 0 && <Warn type="info" msg="Parking auto-disabled since no cars are specified." theme={theme} />}
        {form.roadWidth > 0 && form.roadWidth < 10 && form.carParking && <Warn type="warning" msg={`Road is only ${form.roadWidth}ft wide. Parking may not fit.`} theme={theme} />}
        {form.carParking && (
          <>
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Parking Type</FieldLabel>
            {[{ v: 'open', l: 'Open Parking', i: '🌤️', s: 'Uncovered surface parking' }, { v: 'covered', l: 'Covered Parking', i: '🏗️', s: 'Shade structure / pergola' }, { v: 'garage', l: 'Garage (Enclosed)', i: '🏠', s: 'Fully enclosed with shutters' }, { v: 'stilt', l: 'Stilt / Basement', i: '🏢', s: 'Ground stilt or basement' }].map(({ v, l, i, s }) => (
              <RadioCard key={v} value={v} current={form.parkingType} onPress={(val: any) => upd('parkingType', val)} label={l} icon={i} sub={v === 'garage' && form.roadWidth < 12 ? `⚠️ Narrow road — ${s}` : s} theme={theme} />
            ))}
          </>
        )}
      </View>
    );

    // STEP 6 — Vastu
    if (curId === 5) return (
      <View>
        <SectionHead icon="🧭" step={6} title="Vastu Shastra" sub="Optional: Apply traditional Vastu principles." badge="Optional" theme={theme} />
        <View style={[styles.card, { backgroundColor: form.vastuEnabled ? 'rgba(218,165,32,0.08)' : theme.surfaceContainerLowest, borderColor: form.vastuEnabled ? theme.primary : theme.outlineVariant, borderWidth: 2 }]}>
          <Toggle value={form.vastuEnabled} onToggle={(v: boolean) => upd('vastuEnabled', v)} label="Do you want Vastu-compliant design?" sub="Architects will incorporate Vastu principles into your plan" theme={theme} />
        </View>
        {form.vastuEnabled && (
          <>
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Vastu Strictness</FieldLabel>
            <SegCtrl value={form.vastuStrictness} onChange={(v: VastuStrict) => upd('vastuStrictness', v)} options={[{ value: 'strict', label: 'Strict' }, { value: 'balanced', label: 'Balanced' }, { value: 'flexible', label: 'Flexible' }]} theme={theme} />
            <Text style={[styles.fieldHelp, { color: theme.onSurfaceVariant, marginTop: 8 }]}>
              {form.vastuStrictness === 'strict' ? 'All Vastu rules followed strictly.' : form.vastuStrictness === 'balanced' ? 'Major rules followed, minor deviations allowed.' : 'Comfort first — Vastu applied where possible.'}
            </Text>
            <Divider theme={theme} />
            <FieldLabel theme={theme}>Specific Vastu Requirements</FieldLabel>
            {[{ v: 'kitchen_southeast', l: 'Kitchen MUST be Southeast', i: '🍳' }, { v: 'master_southwest', l: 'Master Bedroom MUST be Southwest', i: '🛏️' }, { v: 'entrance_north_east', l: 'Entrance MUST face North/East', i: '🚪' }, { v: 'pooja_northeast', l: 'Pooja room MUST be Northeast', i: '🙏' }, { v: 'toilets_northwest', l: 'Toilets MUST be Northwest', i: '🚽' }, { v: 'avoid_major', l: 'Avoid major defects only', i: '🛡️' }].map(({ v, l, i }) => {
              const active = form.vastuReqs.includes(v);
              return (
                <Pressable key={v} onPress={() => { const next = active ? form.vastuReqs.filter(r => r !== v) : [...form.vastuReqs, v]; upd('vastuReqs', next); }} style={[styles.checkCard, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.08)' : theme.surfaceContainerLowest, marginBottom: 8 }]}>
                  <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.outline, backgroundColor: active ? theme.primary : 'transparent' }]}>
                    {active && <MaterialIcons name="check" size={10} color={theme.onPrimary} />}
                  </View>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{i}</Text>
                  <Text style={[styles.checkLabel, { color: active ? theme.primary : theme.onSurface, flex: 1 }]}>{l}</Text>
                </Pressable>
              );
            })}
          </>
        )}
      </View>
    );

    // STEP 7 — Style
    if (curId === 6) return (
      <View>
        <SectionHead icon="🎨" step={7} title="Style & Preferences" sub="Choose your architectural style and finish." badge="Optional" theme={theme} />
        <FieldLabel theme={theme}>Architectural Style</FieldLabel>
        {[{ v: 'traditional', l: 'Traditional Indian', i: '🏛️', s: 'Courtyards, carved details, regional elements' }, { v: 'contemporary', l: 'Contemporary / Modern', i: '🏢', s: 'Clean lines, flat roofs, large glass' }, { v: 'eco', l: 'Eco-friendly / Sustainable', i: '🌿', s: 'Green materials, natural ventilation' }, { v: 'mediterranean', l: 'Mediterranean', i: '🏰', s: 'Arches, terracotta, warm tones' }, { v: 'minimalist', l: 'Minimalist', i: '⬜', s: 'Neutral palette, minimal ornamentation' }].map(({ v, l, i, s }) => (
          <RadioCard key={v} value={v} current={form.archStyle} onPress={(val: any) => upd('archStyle', val)} label={l} icon={i} sub={s} theme={theme} />
        ))}
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Finish Quality</FieldLabel>
        <View style={styles.grid2}>
          {[{ v: 'economy', l: 'Economy', s: 'Budget-conscious' }, { v: 'standard', l: 'Standard', s: 'Good quality' }, { v: 'premium', l: 'Premium', s: 'High-end materials' }, { v: 'luxury', l: 'Luxury', s: 'Top-tier custom' }].map(({ v, l, s }) => (
            <ChipCard key={v} value={v} active={form.finish === v} onToggle={() => upd('finish', v as FinishQ)} label={l} theme={theme} />
          ))}
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Window Preference</FieldLabel>
        <SegCtrl value={form.windowPref} onChange={(v: WinPref) => upd('windowPref', v)} options={[{ value: 'large', label: 'Large' }, { value: 'moderate', label: 'Moderate' }, { value: 'small', label: 'Small' }]} theme={theme} />
        <Divider theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, borderWidth: 1 }]}>
          <Toggle value={form.futureExpansion} onToggle={(v: boolean) => upd('futureExpansion', v)} label="Plan to add more floors in future?" sub="Structural design will be reinforced for future expansion" theme={theme} />
        </View>
      </View>
    );

    // STEP 8 — Constraints
    if (curId === 7) return (
      <View>
        <SectionHead icon="🗺️" step={8} title="Site Constraints" sub="Tell us about existing features or limitations." badge="Optional" theme={theme} />
        <FieldLabel help="Helps architects plan around existing infrastructure." theme={theme}>Existing Features on Plot</FieldLabel>
        <View style={styles.grid2}>
          {([{ v: 'borewell', l: 'Borewell', i: '💧' }, { v: 'septic_tank', l: 'Septic Tank', i: '🪣' }, { v: 'trees', l: 'Existing Trees', i: '🌳' }, { v: 'old_structure', l: 'Old Structure', i: '🏚️' }, { v: 'water_tank', l: 'Water Tank', i: '🔵' }, { v: 'electric_pole', l: 'Electric Pole', i: '⚡' }, { v: 'drainage', l: 'Drainage Line', i: '🚰' }] as { v: ExistFeat; l: string; i: string }[]).map(({ v, l, i }) => {
            const active = form.existingFeatures.some(f => f.feature === v);
            const toggle = () => {
              const next = active ? form.existingFeatures.filter(f => f.feature !== v) : [...form.existingFeatures, { feature: v, location: '' }];
              upd('existingFeatures', next);
            };
            return <ChipCard key={v} value={v} active={active} onToggle={toggle} label={l} icon={i} theme={theme} />;
          })}
        </View>
        {form.existingFeatures.length > 0 && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.onSurface, marginTop: 16, marginBottom: 8 }]}>Where is each feature?</Text>
            {form.existingFeatures.map(item => (
              <View key={item.feature} style={[styles.row, { marginBottom: 8 }]}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{({ borewell: '💧', septic_tank: '🪣', trees: '🌳', old_structure: '🏚️', water_tank: '🔵', electric_pole: '⚡', drainage: '🚰' } as any)[item.feature]}</Text>
                <TextInput value={item.location} onChangeText={v => { const next = form.existingFeatures.map(f => f.feature === item.feature ? { ...f, location: v } : f); upd('existingFeatures', next); }} placeholder={`${item.feature} location, e.g. NE corner`} placeholderTextColor={theme.outline} style={[styles.input, { flex: 1, borderColor: theme.outlineVariant, color: theme.onSurface, backgroundColor: theme.surfaceContainerLowest }]} />
              </View>
            ))}
          </>
        )}
        <Divider theme={theme} />
        <FieldLabel help="Affects window placement and natural light." theme={theme}>Neighboring Buildings / Walls</FieldLabel>
        <View style={styles.grid4}>
          {[{ v: 'north', i: '⬆️' }, { v: 'south', i: '⬇️' }, { v: 'east', i: '➡️' }, { v: 'west', i: '⬅️' }].map(({ v, i }) => {
            const active = form.neighborSides.includes(v);
            return (
              <Pressable key={v} onPress={() => { const next = active ? form.neighborSides.filter(s => s !== v) : [...form.neighborSides, v]; upd('neighborSides', next); }} style={[styles.dirBtn, { borderColor: active ? theme.primary : theme.outlineVariant, backgroundColor: active ? 'rgba(218,165,32,0.1)' : theme.surfaceContainerLowest }]}>
                <Text style={{ fontSize: 20 }}>{i}</Text>
                <Text style={[styles.dirLabel, { color: active ? theme.primary : theme.onSurfaceVariant }]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Site Slope</FieldLabel>
        {[{ v: 'flat', l: 'Flat / Level', s: 'No significant slope' }, { v: 'toward_road', l: 'Sloped toward road', s: 'Ground drops toward front' }, { v: 'away_road', l: 'Sloped away from road', s: 'Ground rises toward front' }, { v: 'side', l: 'Side slope', s: 'Ground slopes left or right' }].map(({ v, l, s }) => (
          <RadioCard key={v} value={v} current={form.siteSlope} onPress={(val: any) => upd('siteSlope', val)} label={l} sub={s} theme={theme} />
        ))}
      </View>
    );

    // STEP 9 — Notes
    if (curId === 8) return (
      <View>
        <SectionHead icon="📝" step={9} title="Additional Notes" sub="Anything else our architects should know." badge="Optional" theme={theme} />
        <FieldLabel theme={theme}>Special Requirements</FieldLabel>
        <Text style={[styles.fieldHelp, { color: theme.onSurfaceVariant, marginBottom: 8 }]}>Home theater, gym, skylight, any specific wishes...</Text>
        <View style={{ position: 'relative' }}>
          <TextInput value={form.specialNotes} onChangeText={v => { if (v.length <= 500) upd('specialNotes', v); }} placeholder="e.g. I want a home theater on the first floor..." placeholderTextColor={theme.outline} multiline numberOfLines={5} maxLength={500} style={[styles.textarea, { borderColor: theme.outlineVariant, color: theme.onSurface, backgroundColor: theme.surfaceContainerLowest }]} />
          <Text style={[styles.charCount, { color: form.specialNotes.length > 450 ? '#f59e0b' : theme.onSurfaceVariant }]}>{form.specialNotes.length}/500</Text>
        </View>
        <Divider theme={theme} />
        <FieldLabel theme={theme}>Things You DON'T Want</FieldLabel>
        <Text style={[styles.fieldHelp, { color: theme.onSurfaceVariant, marginBottom: 8 }]}>Open kitchen, dark corridors, flat roof...</Text>
        <View style={{ position: 'relative' }}>
          <TextInput value={form.avoidNotes} onChangeText={v => { if (v.length <= 300) upd('avoidNotes', v); }} placeholder="e.g. No open kitchen, no spiral staircase..." placeholderTextColor={theme.outline} multiline numberOfLines={4} maxLength={300} style={[styles.textarea, { borderColor: theme.outlineVariant, color: theme.onSurface, backgroundColor: theme.surfaceContainerLowest }]} />
          <Text style={[styles.charCount, { color: form.avoidNotes.length > 270 ? '#f59e0b' : theme.onSurfaceVariant }]}>{form.avoidNotes.length}/300</Text>
        </View>
        <Divider theme={theme} />
        <LinearGradient colors={isDark ? ['rgba(218,165,32,0.12)', 'rgba(245,158,11,0.06)'] : ['#fffbeb', '#fff7ed']} style={styles.completionCard}>
          <Text style={{ fontSize: 28 }}>🎉</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: theme.primary, marginBottom: 2 }]}>Almost done!</Text>
            <Text style={[styles.fieldHelp, { color: theme.onSurfaceVariant }]}>Click "Submit & Generate" to preview your full requirements JSON.</Text>
          </View>
        </LinearGradient>
      </View>
    );

    return null;
  };

  // ─── Submitted / JSON view ──
  if (submitted) {
    const json = buildJson();
    const jsonStr = JSON.stringify(json, null, 2);
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.surface }} contentContainerStyle={{ padding: spacing.md }}>
        <LinearGradient colors={['#DAA520', '#F59E0B']} style={styles.successHeader}>
          <Text style={{ fontSize: 48 }}>🏡</Text>
          <Text style={[styles.successTitle, { color: theme.onPrimary }]}>Requirements Submitted!</Text>
          <Text style={[styles.successSub, { color: theme.onPrimary + 'CC' }]}>Your house plan requirements have been captured. Review the generated JSON below.</Text>
        </LinearGradient>
        <Pressable onPress={() => setShowJson(!showJson)} style={[styles.jsonToggle, { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant }]}>
          <MaterialIcons name={showJson ? 'expand-less' : 'expand-more'} size={20} color={theme.primary} />
          <Text style={[styles.jsonToggleText, { color: theme.onSurface }]}>{showJson ? 'Hide' : 'Show'} Generated JSON</Text>
        </Pressable>
        {showJson && (
          <ScrollView horizontal style={[styles.jsonBox, { backgroundColor: isDark ? '#060A16' : '#0A0F23' }]}>
            <Text style={styles.jsonText}>{jsonStr}</Text>
          </ScrollView>
        )}
        <Pressable onPress={() => { setSubmitted(false); setStep(0); setForm(DEFAULTS); }} style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 16 }]}>
          <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>Start a New Plan</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ─── Main wizard render ──
  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      {/* Progress header */}
      <View style={[styles.progressHeader, { backgroundColor: theme.surfaceContainerLowest, borderBottomColor: theme.outlineVariant }]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: theme.onSurfaceVariant }]}>Step {step + 1} of {totalSteps}</Text>
          <Text style={[styles.progressPct, { color: theme.primary }]}>{progress}%</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceContainer }]}>
          <LinearGradient colors={['#DAA520', '#F59E0B']} style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        {/* Step pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {activeSteps.map((s, idx) => {
              const done = idx < step;
              const active = idx === step;
              return (
                <Pressable key={s.id} onPress={() => idx <= step && setStep(idx)}
                  style={[styles.stepPill, { backgroundColor: active ? 'rgba(218,165,32,0.15)' : done ? 'rgba(22,163,74,0.1)' : theme.surfaceContainer, borderColor: active ? theme.primary : done ? '#16a34a' : theme.outlineVariant }]}>
                  <View style={[styles.pillDot, { backgroundColor: active ? theme.primary : done ? '#16a34a' : theme.outlineVariant }]}>
                    {done ? <MaterialIcons name="check" size={8} color="#fff" /> : <Text style={{ fontSize: 8, color: active ? theme.onPrimary : theme.onSurfaceVariant, fontWeight: '700' }}>{idx + 1}</Text>}
                  </View>
                  <Text style={[styles.pillLabel, { color: active ? theme.primary : done ? '#16a34a' : theme.onSurfaceVariant }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Step content */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      {/* Navigation footer */}
      <View style={[styles.footer, { backgroundColor: theme.surfaceContainerLowest, borderTopColor: theme.outlineVariant, paddingBottom: isWide ? 16 : 90 }]}>
        <Pressable onPress={goPrev} disabled={step === 0}
          style={({ pressed }) => [styles.backBtn, { borderColor: theme.outlineVariant, opacity: step === 0 ? 0.3 : pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="chevron-left" size={20} color={theme.onSurface} />
          <Text style={[styles.backBtnText, { color: theme.onSurface }]}>Back</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.stepBadge, { color: theme.onSurfaceVariant }]}>{activeSteps[step]?.badge}</Text>
        </View>
        <Pressable onPress={goNext}
          style={({ pressed }) => [styles.nextBtn, { opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={['#DAA520', '#F59E0B']} style={styles.nextBtnInner}>
            <Text style={[styles.nextBtnText, { color: '#0A0F23' }]}>
              {step === totalSteps - 1 ? 'Submit & Generate' : 'Next'}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color="#0A0F23" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  progressHeader: { paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressPct: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pillLabel: { fontSize: 11, fontWeight: '600' },
  content: { padding: spacing.md },
  sectionHead: { flexDirection: 'row', gap: 14, marginBottom: 24, alignItems: 'flex-start' },
  sectionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#DAA520', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  stepTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  badge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 2, lineHeight: 24 },
  sectionSub: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  divider: { height: 1, marginVertical: 16, opacity: 0.5 },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  fieldHelp: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  card: { borderRadius: radius.xl, padding: spacing.md, marginBottom: 4 },
  cardGroupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  trackOuter: { width: 44, height: 24, borderRadius: 12, position: 'relative' },
  trackThumb: { position: 'absolute', top: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 18, fontWeight: '800', width: 28, textAlign: 'center' },
  segCtrl: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segText: { fontSize: 13 },
  radioCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, borderWidth: 2, padding: spacing.sm, marginBottom: 10, gap: 10 },
  cardIcon: { fontSize: 22 },
  cardLabel: { fontSize: 14, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDotInner: { width: 8, height: 8, borderRadius: 4 },
  chipCard: { borderRadius: 14, borderWidth: 2, padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 72, position: 'relative' },
  chipLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  chipCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBadge: { fontSize: 14, fontWeight: '800' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  dirBtn: { flex: 1, minWidth: '22%', borderRadius: 12, borderWidth: 1.5, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dirLabel: { fontSize: 10, fontWeight: '700' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, height: 44 },
  inputSm: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, height: 44, maxWidth: 160 },
  inputTag: { fontSize: 10, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  dimX: { fontSize: 20, fontWeight: '300', paddingBottom: 18 },
  areaText: { fontSize: 12, fontWeight: '700', marginTop: 4, marginBottom: 4 },
  warn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  warnText: { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 16 },
  autoHint: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  textarea: { borderWidth: 1.5, borderRadius: 14, padding: 12, fontSize: 13, textAlignVertical: 'top', minHeight: 100 },
  charCount: { position: 'absolute', bottom: 10, right: 12, fontSize: 10, fontWeight: '600' },
  completionCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderTopWidth: 1, ...Platform.select({ web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' } as any }), },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  stepBadge: { fontSize: 11, fontWeight: '600' },
  nextBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: '#DAA520', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  nextBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingVertical: 11 },
  nextBtnText: { fontSize: 14, fontWeight: '800' },
  successHeader: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 12, marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  successSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  jsonToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  jsonToggleText: { fontSize: 14, fontWeight: '600' },
  jsonBox: { borderRadius: 14, padding: 16, marginTop: 10, maxHeight: 320 },
  jsonText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }), fontSize: 11, color: '#4ade80', lineHeight: 18 },
  primaryBtn: { borderRadius: 16, padding: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '800' },
  // chip grid item sizing
});

// Make chips fill 2-column grid evenly
(styles as any).chipCard = { ...styles.chipCard, width: '48%' };
(styles as any).checkCard = { ...styles.checkCard, width: '48%' };
