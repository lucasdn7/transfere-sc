import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import { useRef } from 'react';
import React from 'react';

interface DocumentUploadFormData {
  title: string;
  description?: string;
  document_category_id?: number;
  is_public: boolean;
  validity_date?: string;
  file: FileList;
}

interface DocumentUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  document?: any;
  isEditMode?: boolean;
}

export function DocumentUploadForm({ onSuccess, onCancel, document, isEditMode }: DocumentUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keepFileName, setKeepFileName] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [categoryMode, setCategoryMode] = useState<'select' | 'custom'>('select');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const { toast } = useToast();
  const customCategoryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<DocumentUploadFormData>({
    defaultValues: {
      is_public: true,
    },
  });
  const descriptionValue = watch('description') || '';

  // Preencher campos ao entrar em modo edição
  React.useEffect(() => {
    if (isEditMode && document) {
      setKeepFileName(false);
      setCustomTitle(document.title || '');
      setValue('description', document.description || '');
      setIsPublic(document.is_public ?? true);
      if (document.document_category_id) {
        setCategoryMode('select');
        setSelectedCategoryId(document.document_category_id.toString());
      }
    }
    if (!isEditMode) {
      reset();
      setCustomTitle('');
      setSelectedFile(null);
      setCategoryMode('select');
      setSelectedCategoryId('');
      setIsPublic(true);
    }
  }, [isEditMode, document, setValue, reset]);

  const CATEGORIAS_FIXAS = [
    'Ofícios',
    'Pareceres Técnicos',
    'Pareceres Judiciais',
    'Leis',
    'Decretos',
    'Modelos',
    'Normas',
    'Notas Oficiais',
    'Informativos',
    'Anexos',
  ];

  const { data: categoriesDb = [] } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
  // Garante que as categorias fixas sempre aparecem, sem duplicar
  const categories = [
    ...CATEGORIAS_FIXAS.filter(
      (fixa) => !categoriesDb.some((cat: any) => cat.name.toLowerCase() === fixa.toLowerCase())
    ).map((name) => ({ id: `fixa-${name}`, name })),
    ...categoriesDb,
  ];

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!selectedFile && !isEditMode) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Por favor, selecione um arquivo para upload.',
        variant: 'destructive',
      });
      return;
    }

    // Validação da categoria
    if (categoryMode === 'select' && !selectedCategoryId) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Por favor, selecione uma categoria para o documento.',
        variant: 'destructive',
      });
      return;
    }

    if (categoryMode === 'custom' && !customCategory.trim()) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Digite o nome da nova categoria.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      let categoryId: number | null = null;
      
      // Se for nova categoria, cria e pega o id
      if (categoryMode === 'custom' && customCategory.trim()) {
        // Verifica se já existe (case insensitive)
        const existing = categoriesDb.find(
          (cat: any) => cat.name.toLowerCase() === customCategory.trim().toLowerCase()
        );
        if (existing) {
          categoryId = existing.id;
        } else {
          const { data: newCat, error: catError } = await supabase
            .from('document_categories')
            .insert({ name: customCategory.trim() })
            .select('id')
            .single();
          if (catError) throw catError;
          categoryId = newCat.id;
        }
      } else if (selectedCategoryId && String(selectedCategoryId).startsWith('fixa-')) {
        // Se for categoria fixa ainda não cadastrada, cria
        const fixaName = categories.find((c) => String(c.id) === String(selectedCategoryId))?.name;
        if (fixaName) {
          const { data: newCat, error: catError } = await supabase
            .from('document_categories')
            .insert({ name: fixaName })
            .select('id')
            .single();
          if (catError) throw catError;
          categoryId = newCat.id;
        }
      } else if (selectedCategoryId) {
        // Categoria já existente no banco
        categoryId = Number(selectedCategoryId);
      }

      // Garantir que temos uma categoria válida
      if (!categoryId) {
        throw new Error('Categoria é obrigatória. Por favor, selecione ou crie uma categoria.');
      }

      let fileName = document?.file_path;
      let fileMeta = {
        file_name: document?.file_name,
        file_size: document?.file_size,
        file_mime_type: document?.file_mime_type,
        file_path: document?.file_path,
      };
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, selectedFile, { upsert: true });
        if (uploadError) throw uploadError;
        fileMeta = {
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_mime_type: selectedFile.type,
          file_path: fileName,
        };
      }
      const finalTitle = keepFileName && selectedFile ? selectedFile.name : customTitle || (selectedFile ? selectedFile.name : document?.title);
      // Montar objeto apenas com campos editáveis
      const documentData: any = {
        title: customTitle || document?.title || '',
        description: descriptionValue,
        is_public: isPublic,
        document_category_id: categoryId,
      };
      if (selectedFile) {
        documentData.file_name = selectedFile.name;
        documentData.file_size = selectedFile.size;
        documentData.file_mime_type = selectedFile.type;
        documentData.file_path = fileName;
      }
      if (isEditMode && document?.id) {
        // Atualizar documento existente
        const { data: updated, error: updateError } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', document.id)
          .select();
        if (updateError) throw updateError;
        if (!updated || updated.length === 0) throw new Error('Nenhuma linha foi atualizada.');
      } else {
        // Inserir novo documento
        const { error: insertError } = await supabase
          .from('documents')
          .insert(documentData);
        if (insertError) throw insertError;
      }

      await supabase.from('notifications').insert({
        message: `Novo documento disponível: "${finalTitle}" para download na área pública de Documentação!`,
        type: 'informative',
        is_public: true,
        created_at: new Date().toISOString(),
        is_read: false
      });
      
      toast({
        title: isEditMode ? 'Documento atualizado com sucesso' : 'Documento enviado com sucesso',
        description: isEditMode ? 'O documento foi atualizado.' : 'O documento foi adicionado à biblioteca.',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: isEditMode ? 'Erro ao atualizar documento' : 'Erro ao enviar documento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    if (file && keepFileName) setCustomTitle('');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-end space-x-4 pb-4 border-b mb-4 bg-white sticky top-0 left-0 z-20">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (isEditMode ? 'Salvando...' : 'Enviando...') : (isEditMode ? 'Salvar' : 'Enviar Documento')}
            </Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-2 pb-4">
            {/* Nome do documento */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="keepFileName"
                  checked={keepFileName}
                  onChange={e => setKeepFileName(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="keepFileName">Manter o nome do arquivo</Label>
              </div>
              {!keepFileName && (
                <div className="space-y-2">
                  <Label htmlFor="customTitle">Nome personalizado do arquivo *</Label>
                  <Input
                    id="customTitle"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="Digite o nome que será exibido ao público"
                    required={!keepFileName}
                  />
                </div>
              )}
            </div>
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                value={descriptionValue}
                onChange={e => setValue('description', e.target.value)}
                placeholder="Descrição do documento..."
                rows={3}
              />
            </div>
            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <div className="flex gap-2 items-center">
                <Select
                  value={categoryMode === 'select' ? selectedCategoryId : ''}
                  onValueChange={val => {
                    setCategoryMode('select');
                    setSelectedCategoryId(val);
                    setValue('document_category_id', Number(val));
                  }}
                  disabled={categoryMode === 'custom'}
                >
                  <SelectTrigger className={!selectedCategoryId && categoryMode === 'select' ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione uma categoria (obrigatório)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant={categoryMode === 'custom' ? 'default' : 'outline'}
                  onClick={() => {
                    setCategoryMode('custom');
                    setTimeout(() => customCategoryInputRef.current?.focus(), 100);
                  }}
                >
                  Nova Categoria
                </Button>
              </div>
              {categoryMode === 'custom' && (
                <div className="flex gap-2 mt-2">
                  <Input
                    ref={customCategoryInputRef}
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Digite a nova categoria (obrigatório)"
                    className={!customCategory.trim() ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCategoryMode('select')}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              {!selectedCategoryId && categoryMode === 'select' && (
                <p className="text-sm text-red-500">Categoria é obrigatória</p>
              )}
              {categoryMode === 'custom' && !customCategory.trim() && (
                <p className="text-sm text-red-500">Digite o nome da nova categoria</p>
              )}
            </div>
            {/* Upload do arquivo */}
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                {selectedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{selectedFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex flex-col items-center justify-center py-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-gray-400 mb-2">Clique para selecionar um arquivo</span>
                  </Button>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                />
              </div>
            </div>
            {/* Público ou restrito */}
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="is_public"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is_public">Documento público (visível para todos). Desmarque para restringir à área técnica.</Label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
