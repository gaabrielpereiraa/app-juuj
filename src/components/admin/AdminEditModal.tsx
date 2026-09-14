import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Field, validateFields } from '../../lib/admin';
import DraggableModal from '../DraggableModal';

interface AdminEditModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  initial: Record<string, any>;
  onSave: (values: Record<string, any>) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving?: boolean;
}

export default function AdminEditModal({
  visible,
  onClose,
  title,
  fields,
  initial,
  onSave,
  onDelete,
  saving,
}: AdminEditModalProps) {
  const [raw, setRaw] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Recarrega o form sempre que abrir com outro registro
  useEffect(() => {
    if (!visible) return;
    const next: Record<string, any> = {};
    for (const field of fields) {
      const value = initial[field.key];
      next[field.key] =
        field.type === 'switch' ? value !== false : value == null ? '' : String(value);
    }
    setRaw(next);
    setErrors({});
    setConfirmDelete(false);
    setFormError(null);
  }, [visible, initial]);

  const handleSave = async () => {
    const { values, errors: found } = validateFields(fields, raw);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setFormError(null);
    try {
      await onSave(values);
      onClose();
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setFormError(null);
    try {
      await onDelete();
      onClose();
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao excluir');
    }
  };

  return (
    <DraggableModal visible={visible} onClose={onClose}>
      <ScrollView contentContainerClassName="px-6 pb-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-text-light mb-4">{title}</Text>

        {fields.map((field) => (
          <View key={field.key} className="mb-4">
            {field.type === 'switch' ? (
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base text-text-light">{field.label}</Text>
                <Switch
                  value={!!raw[field.key]}
                  onValueChange={(v) => setRaw((p) => ({ ...p, [field.key]: v }))}
                  trackColor={{ true: '#f47b25', false: '#d8cfc4' }}
                />
              </View>
            ) : (
              <>
                <Text className="text-sm font-medium text-text-secondary mb-1">
                  {field.label}
                  {field.required ? ' *' : ''}
                </Text>
                <TextInput
                  value={raw[field.key] ?? ''}
                  onChangeText={(t) => setRaw((p) => ({ ...p, [field.key]: t }))}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9E6B47"
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  className="rounded-xl bg-card-light border border-text-light/15 px-4 py-3 text-base text-text-light"
                />
                {errors[field.key] ? (
                  <Text className="text-red-600 text-xs mt-1">{errors[field.key]}</Text>
                ) : null}
              </>
            )}
          </View>
        ))}

        {formError ? (
          <Text className="text-red-600 text-sm mb-3">{formError}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          className="rounded-2xl bg-primary py-4 items-center mb-3"
          style={saving ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-white font-bold text-base">
            {saving ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.8}
            className="flex flex-row items-center justify-center gap-2 py-3"
          >
            <Ionicons name="trash-outline" size={18} color="#b91c1c" />
            <Text className="text-red-700 font-medium">
              {confirmDelete ? 'Toque de novo para confirmar' : 'Excluir'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </DraggableModal>
  );
}
