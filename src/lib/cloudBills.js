import { getSupabaseClient, getSupabaseRedirectUrl } from './supabase';

const BILLS_TABLE = 'bills';

const normalizeBillRecord = (record) => {
  const entries = Array.isArray(record.entries)
    ? record.entries.map((entry, index) => ({
        id: entry?.id ?? `entry-${index}`,
        date: entry?.date ?? '',
        endDate: entry?.endDate ?? entry?.returnDate ?? '',
        amount: entry?.amount ?? '',
        days: entry?.days ?? '',
        daily: entry?.daily ?? ''
      }))
    : [];

  return {
    id: record.id,
    name: record.name ?? '',
    entries,
    endDate: record.end_date ?? '',
    useEntryEndDates:
      typeof record.use_entry_return_dates === 'boolean'
        ? record.use_entry_return_dates
        : entries.some(
            (entry) => (entry?.endDate ?? entry?.returnDate ?? '').trim()
          ),
    roundingAdjustment: Number(record.rounding_adjustment) || 0,
    billRuleMode: record.bill_rule_mode === 'custom' ? 'custom' : 'global',
    billCalcRules: record.bill_calc_rules ?? null,
    statementLanguage: record.statement_language === 'en' ? 'en' : 'te',
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null
  };
};

const serializeBillRecord = (userId, bill) => ({
  id: bill.id,
  user_id: userId,
  name: bill.name ?? '',
  entries: Array.isArray(bill.entries) ? bill.entries : [],
  end_date: bill.endDate ?? '',
  use_entry_return_dates: Boolean(bill.useEntryEndDates),
  rounding_adjustment: Number(bill.roundingAdjustment) || 0,
  bill_rule_mode: bill.billRuleMode === 'custom' ? 'custom' : 'global',
  bill_calc_rules:
    bill.billRuleMode === 'custom' ? bill.billCalcRules ?? null : null,
  statement_language: bill.statementLanguage === 'en' ? 'en' : 'te',
  created_at: bill.createdAt ?? null,
  updated_at: bill.updatedAt ?? null
});

export const fetchCloudBills = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from(BILLS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map(normalizeBillRecord) : [];
};

export const upsertCloudBills = async (userId, bills) => {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return;
  }

  const payload = Array.isArray(bills)
    ? bills.map((bill) => serializeBillRecord(userId, bill))
    : [];

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase.from(BILLS_TABLE).upsert(payload);

  if (error) {
    throw error;
  }
};

export const deleteCloudBill = async (userId, billId) => {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !billId) {
    return;
  }

  const { error } = await supabase
    .from(BILLS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', billId);

  if (error) {
    throw error;
  }
};

export const getCloudUser = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user ?? null;
};

export const signInToCloud = async (email) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getSupabaseRedirectUrl()
    }
  });

  if (error) {
    throw error;
  }
};

export const signOutFromCloud = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

export const subscribeToCloudAuth = (callback) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
};
