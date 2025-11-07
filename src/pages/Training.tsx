import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  Play,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getRecentSessions,
  createSession,
  uploadTrainingFile,
  getPublicUrl,
  startTraining,
} from '@/lib/api';
import { type TrainingSession, type TrainingImage, type StartTrainingDto, ModelType, ItemCategory, PriorityLevel } from '@/types/api';
import ImageAnnotator from '@/components/ImageAnnotator';
import { toast } from 'sonner'

type TrainingStep = 'upload' | 'annotate' | 'parameters';

type UploadedFileState = TrainingImage & {
  status?: 'processing' | 'uploaded' | 'error';
};

// Função para calcular "time ago" (copiada da lógica do mock)
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
}

export default function Training() {
  const [currentStep, setCurrentStep] = useState<TrainingStep>('upload');
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<StartTrainingDto>({
    modelType: ModelType.OBJECT_DETECTION,
    epochs: 100,
    learningRate: 0.001,
    batchSize: 32,
    itemName: '',
    description: '',
    category: ItemCategory.SAFETY,
    priority: PriorityLevel.HIGH,
    detectionThreshold: 85,
  });

  // 1. Busca sessões recentes para a sidebar
  const {
    data: recentSessions,
    isLoading: isLoadingSessions,
  } = useQuery<TrainingSession[]>({
    queryKey: ['trainingSessions'],
    queryFn: getRecentSessions,
    refetchInterval: 5000, // Atualiza a lista de sessões a cada 5s
  });

  // 2. Mutação para criar uma nova sessão
  const createSessionMutation = useMutation({
    mutationFn: createSession,
  });

  // 3. Mutação para fazer upload do arquivo
  const uploadFileMutation = useMutation({
    mutationFn: uploadTrainingFile,
    onSuccess: (data: TrainingImage) => {

      setUploadedFiles((currentFiles) => {
        const indexToUpdate = currentFiles.findIndex(
          (f) => f.session.id === data.session.id
        );

        if (indexToUpdate === -1) return currentFiles;

        const newFiles = [...currentFiles];
        newFiles[indexToUpdate] = {
          ...data,
          status: 'uploaded',
        };
        return newFiles;
      });
      queryClient.invalidateQueries({ queryKey: ['trainingSessions'] });
    },
    onError: (error, variables) => {
    },
  });

  const startTrainingMutation = useMutation({
    mutationFn: startTraining,
    onSuccess: (data: TrainingSession) => {
      toast.success(`Treinamento "${data.name}" iniciado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['trainingSessions'] });
    },
    onError: (error) => {
      console.error('Erro ao iniciar treinamento:', error);
      toast.error('Erro ao iniciar treinamento. Tente novamente.');
    },
  });

  useEffect(() => {

    if (!isNavigatingNext || uploadedFiles.length === 0) {
      return;
    }

    const allFilesReady = uploadedFiles.every(
      (f) => f.status === 'uploaded'
    );

    if (allFilesReady) {
      setCurrentStep('annotate');
      setIsNavigatingNext(false);
    }
  }, [isNavigatingNext, uploadedFiles]);

  const handleBrowseClick = (
    e?: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
  ) => {
    e?.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newSession = await createSessionMutation.mutateAsync({
        name: file.name.split('.')[0].replace(/[-_]/g, ' '),
      });

      setUploadedFiles((files) => [
        ...files,
        {
          id: 'temp-' + file.name,
          filename: file.name,
          storagePath: '',
          status: 'processing',
          session: newSession,
        } as UploadedFileState,
      ]);

      uploadFileMutation.mutate({ file, sessionId: newSession.id });

      event.target.value = '';
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      // Remove o placeholder se a criação da sessão falhar
      setUploadedFiles((files) =>
        files.filter((f) => f.filename !== file.name),
      );
    }
  };

  // --- RENDERIZAÇÃO DA SIDEBAR ---

  const renderRecentSessions = () => {
    if (isLoadingSessions) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-gray-800" />
        ));
    }

    if (!recentSessions || recentSessions.length === 0) {
      return (
        <p className="text-xs text-gray-500 text-center">
          Nenhuma sessão de treinamento.
        </p>
      );
    }

    return recentSessions.map((session) => (
      <div key={session.id} className="p-2 bg-gray-800 rounded text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium">{session.name}</span>
          <span
            className={`px-2 py-0.5 rounded ${
              session.status === 'complete'
                ? 'bg-green-500/20 text-green-400'
                : session.status === 'processing'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {session.status}
          </span>
        </div>
        <span className="text-gray-500">{formatTimeAgo(session.createdAt)}</span>
      </div>
    ));
  };

  const handleFormInputChange = (
    field: keyof StartTrainingDto,
    value: string | number,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleSubmitTraining = () => {
    // Pega a sessão do primeiro arquivo (assumindo que todos são da mesma sessão)
    const sessionId = uploadedFiles[0]?.session?.id;
    if (!sessionId) {
      toast.error('Nenhuma sessão de upload encontrada.');
      return;
    }
  
    // Prepara os dados com os tipos corretos (números)
    const trainingParams: StartTrainingDto = {
      ...formState,
      epochs: Number(formState.epochs),
      learningRate: Number(formState.learningRate),
      batchSize: Number(formState.batchSize),
      detectionThreshold: Number(formState.detectionThreshold),
    };
  
    startTrainingMutation.mutate({ sessionId, params: trainingParams });
  };

  const steps = [
    { id: 'upload', label: 'Data Upload', icon: CheckCircle2 },
    {
      id: 'annotate',
      label: 'Label Annotation',
      icon: currentStep === 'annotate' ? Loader2 : Circle,
    },
    { id: 'parameters', label: 'Training Parameters', icon: Circle },
  ];

  // Pega a imagem atual para o anotador
  const currentImage = uploadedFiles[currentImageIndex];

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">AI Training Module</h1>
          <p className="text-gray-400">
            Configure and train your AI model for enhanced detection
            capabilities in industrial environments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Progress */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800 p-4">
              <h2 className="text-lg font-semibold mb-4">Training Progress</h2>

              <div className="space-y-4 mb-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted =
                    steps.findIndex((s) => s.id === currentStep) > index;

                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500'
                            : isActive
                            ? 'bg-blue-500'
                            : 'bg-gray-700'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive && step.icon === Loader2
                              ? 'animate-spin'
                              : ''
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm ${
                          isActive ? 'text-white font-medium' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Overall Progress</span>
                  <span className="font-medium">35%</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-sm font-semibold mb-3">
                  Recent Training Sessions
                </h3>
                <div className="space-y-2">{renderRecentSessions()}</div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <Card className="bg-gray-900 border-gray-800 p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Training Data Upload
                  </h2>

                  {/* Input de arquivo escondido */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg,image/png,application/zip"
                  />

                  <div
                    className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={handleBrowseClick}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-lg mb-2">
                      Drag and drop your training images here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: JPG, PNG, ZIP (Max 500MB)
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation(); // Correção do bug de clique duplo
                        handleBrowseClick();
                      }}
                    >
                      Browse Files
                    </Button>
                  </div>

                  <div className="mt-6 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <span className="text-sm">{file.filename}</span>
                        <div className="flex items-center gap-2">
                          {file.status === 'uploaded' && (
                            <span className="text-xs text-green-400 font-medium">
                              Uploaded
                            </span>
                          )}
                          {file.status === 'processing' && (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              <span className="text-xs text-blue-400 font-medium">
                                Processing...
                              </span>
                            </>
                          )}
                          {file.status === 'error' && (
                            <span className="text-xs text-red-400 font-medium">
                              Error
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-end">
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsNavigatingNext(true)}
                    disabled={
                      uploadedFiles.length === 0 ||
                      uploadFileMutation.isPending || // Desabilita se estiver ATIVAMENTE fazendo upload
                      createSessionMutation.isPending || // Desabilita se estiver criando a sessão
                      isNavigatingNext // Desabilita após o clique, enquanto espera a transição
                    }
                  >
                    {/* Mostra um spinner se estivermos esperando a transição */}
                    {(uploadFileMutation.isPending || isNavigatingNext) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Next: Label Annotation
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'annotate' && (
              <div className="space-y-6">
                <Card className="bg-gray-900 border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Label Annotation</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Draw bounding boxes and assign labels to objects in your
                        training images
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      Image {currentImageIndex + 1} of {uploadedFiles.length}
                    </div>
                  </div>

                  {/* Passa o ID da imagem e a URL completa para o anotador */}
                  {currentImage && currentImage.storagePath ? (
                    <ImageAnnotator
                      key={currentImage.id} // Chave React para forçar remount ao mudar de imagem
                      imageId={currentImage.id}
                      imageUrl={getPublicUrl(currentImage.storagePath)}
                    />
                  ) : (
                    <div className="text-center p-10 text-gray-500">
                       <Loader2 className="w-8 h-8 animate-spin" />
                       <p className="mt-2">Loading image...</p>
                    </div>
                  )}
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => setCurrentStep('upload')}
                  >
                    Back
                  </Button>
                  
                  {/* TODO: Adicionar botões de < Anterior e Próxima Imagem > aqui */}

                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setCurrentStep('parameters')}
                  >
                    Next: Training Parameters
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'parameters' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-900 border-gray-800 p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Training Parameters
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-400">Model Type</Label>
                        <Select
                          value={formState.modelType}
                          onValueChange={(value: ModelType) =>
                            handleFormInputChange('modelType', value)
                          }
                        >
                          <SelectTrigger className="mt-1 bg-gray-950 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ModelType.OBJECT_DETECTION}>
                              Object Detection
                            </SelectItem>
                            <SelectItem value={ModelType.CLASSIFICATION}>
                              Classification
                            </SelectItem>
                            <SelectItem value={ModelType.SEGMENTATION}>
                              Segmentation
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Training Epochs</Label>
                        <Input
                          type="number"
                          value={formState.epochs}
                          onChange={(e) =>
                            handleFormInputChange('epochs', e.target.value)
                          }
                          className="mt-1 bg-gray-950 border-gray-700"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Learning Rate</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={formState.learningRate}
                          onChange={(e) =>
                            handleFormInputChange('learningRate', e.target.value)
                          }
                          className="mt-1 bg-gray-950 border-gray-700"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Batch Size</Label>
                        <Input
                          type="number"
                          value={formState.batchSize}
                          onChange={(e) =>
                            handleFormInputChange('batchSize', e.target.value)
                          }
                          className="mt-1 bg-gray-950 border-gray-700"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-900 border-gray-800 p-6">
                    <h2 className="text-xl font-semibold mb-4">Item Registration</h2>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-400">Item Name</Label>
                        <Input
                          placeholder="Enter item name"
                          value={formState.itemName}
                          onChange={(e) =>
                            handleFormInputChange('itemName', e.target.value)
                          }
                          className="mt-1 bg-gray-950 border-gray-700"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Description</Label>
                        <Textarea
                          placeholder="Describe the item characteristics"
                          value={formState.description}
                          onChange={(e) =>
                            handleFormInputChange('description', e.target.value)
                          }
                          className="mt-1 bg-gray-950 border-gray-700 min-h-[100px]"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Category</Label>
                        <Select
                          value={formState.category}
                          onValueChange={(value: ItemCategory) =>
                            handleFormInputChange('category', value)
                          }
                        >
                          <SelectTrigger className="mt-1 bg-gray-950 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ItemCategory.SAFETY}>
                              Safety Equipment
                            </SelectItem>
                            <SelectItem value={ItemCategory.PARTS}>Parts</SelectItem>
                            <SelectItem value={ItemCategory.DEFECTS}>Defects</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Priority Level</Label>
                        <Select
                          value={formState.priority}
                          onValueChange={(value: PriorityLevel) =>
                            handleFormInputChange('priority', value)
                          }
                        >
                          <SelectTrigger className="mt-1 bg-gray-950 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PriorityLevel.HIGH}>High</SelectItem>
                            <SelectItem value={PriorityLevel.MEDIUM}>Medium</SelectItem>
                            <SelectItem value={PriorityLevel.LOW}>Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400 mb-2 block">
                          Detection Threshold
                        </Label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formState.detectionThreshold}
                            onChange={(e) =>
                              handleFormInputChange('detectionThreshold', e.target.value)
                            }
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">
                            {formState.detectionThreshold}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => setCurrentStep('annotate')}
                    disabled={startTrainingMutation.isPending}
                  >
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      disabled={startTrainingMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      disabled={startTrainingMutation.isPending}
                    >
                      Save Draft
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleSubmitTraining}
                      disabled={startTrainingMutation.isPending}
                    >
                      {startTrainingMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start Training
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Button variant="ghost" size="sm">
                    ‹
                  </Button>
                  <span>3 / 3</span>
                  <Button variant="ghost" size="sm">
                    ›
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}