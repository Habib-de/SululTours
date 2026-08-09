import React, { useState, useEffect } from 'react';
import { 
  Brain, Sparkles, Activity, BarChart3, TrendingUp,
  TrendingDown, Clock, CheckCircle, AlertCircle,
  Play, Pause, RefreshCw, Download, Eye,
  Server, Database, Zap, Layers, X, Plus
} from 'lucide-react';

const MLModels = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedModelDetail, setSelectedModelDetail] = useState(null);

  // ============================================
  // LOAD DATA FROM LOCALSTORAGE
  // ============================================
  const loadModels = () => {
    setIsLoading(true);

    // ✅ Check if models exist in localStorage
    const savedModels = localStorage.getItem('fleetman_ml_models');
    
    if (savedModels) {
      try {
        const parsedModels = JSON.parse(savedModels);
        setModels(parsedModels);
        console.log('📋 Loaded ML models from localStorage:', parsedModels.length);
      } catch (e) {
        console.error('Failed to load ML models:', e);
        setModels([]);
      }
    } else {
      // ✅ No models found - empty state
      setModels([]);
      console.log('ℹ️ No ML models found in localStorage');
    }

    setIsLoading(false);
  };

  // ============================================
  // USE EFFECTS
  // ============================================
  useEffect(() => {
    loadModels();

    const handleDataUpdate = () => {
      loadModels();
    };

    window.addEventListener('mlModelsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('mlModelsUpdated', handleDataUpdate);
    };
  }, []);

  // ============================================
  // SAVE MODELS TO LOCALSTORAGE
  // ============================================
  const saveModels = (data) => {
    localStorage.setItem('fleetman_ml_models', JSON.stringify(data));
    setModels(data);
    window.dispatchEvent(new CustomEvent('mlModelsUpdated', { detail: { models: data } }));
  };

  // ============================================
  // HELPERS
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-700',
      'training': 'bg-yellow-100 text-yellow-700',
      'development': 'bg-blue-100 text-blue-700',
      'failed': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return '🟢 Active';
      case 'training': return '🟡 Training';
      case 'development': return '🔵 Development';
      case 'failed': return '🔴 Failed';
      default: return '⚪ Unknown';
    }
  };

  const openDetailModal = (model) => {
    setSelectedModelDetail(model);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedModelDetail(null);
  };

  // ============================================
  // ADD SAMPLE MODEL (for testing)
  // ============================================
  const addSampleModel = () => {
    const newModel = {
      id: `model_${Date.now()}`,
      name: 'Sample ML Model',
      type: 'Classification',
      accuracy: '92%',
      status: 'active',
      version: 'v1.0',
      deployed: new Date().toISOString().split('T')[0],
      lastRun: new Date().toISOString(),
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      trainingEpochs: 100,
      totalEpochs: 100,
      trainingTime: 'Completed',
      metrics: {
        precision: '90%',
        recall: '88%',
        f1Score: '89%',
        accuracy: '92%'
      },
      details: {
        'Total Data Points': '1,234',
        'Model Size': '45 MB',
        'Training Duration': '2.3 hours',
        'Framework': 'TensorFlow'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedModels = [...models, newModel];
    saveModels(updatedModels);
  };

  const totalStats = {
    total: models.length,
    active: models.filter(m => m.status === 'active').length,
    training: models.filter(m => m.status === 'training').length,
    avgAccuracy: models.length > 0 ? Math.round(models.reduce((sum, m) => sum + parseFloat(m.accuracy), 0) / models.length) : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading ML models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Brain size={24} className="text-purple-600" />
              ML Models
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage machine learning models and training pipelines · 
              <span className="font-medium text-gray-700 ml-1">{totalStats.total} models</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={addSampleModel}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={16} /> Add Sample Model
            </button>
            <button 
              onClick={loadModels}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Total Models</p>
          <p className="text-2xl font-bold">{totalStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{totalStats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Training</p>
          <p className="text-2xl font-bold text-yellow-600">{totalStats.training}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Avg Accuracy</p>
          <p className="text-2xl font-bold text-purple-600">{totalStats.avgAccuracy}%</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        {['overview', 'training', 'performance'].map((view) => (
          <button 
            key={view}
            onClick={() => setViewMode(view)}
            className={`px-4 py-1.5 text-sm rounded-lg capitalize transition-colors ${
              viewMode === view ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Models Grid - EMPTY STATE */}
      {models.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Brain size={64} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-xl font-semibold text-gray-600 mb-2">No ML Models Found</h4>
          <p className="text-gray-400 max-w-md mx-auto">
            You haven't created any machine learning models yet. 
            Click the "Train New Model" button to get started.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <Sparkles size={18} /> Train New Model
            </button>
            <button 
              onClick={addSampleModel}
              className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <Plus size={18} /> Add Sample Model
            </button>
          </div>
        </div>
      ) : (
        // Models Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <div 
              key={model.id} 
              className={`bg-white p-5 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                selectedModel?.id === model.id ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
              }`}
              onClick={() => setSelectedModel(selectedModel?.id === model.id ? null : model)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Brain size={18} className="text-purple-600 flex-shrink-0" />
                    <h4 className="font-semibold text-sm truncate">{model.name}</h4>
                    <span className="text-xs text-gray-400 flex-shrink-0">{model.version}</span>
                  </div>
                  <p className="text-sm text-gray-500">{model.type}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ml-2 ${getStatusColor(model.status)}`}>
                  {getStatusBadge(model.status)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Accuracy</span>
                  <p className="font-bold text-green-600">{model.accuracy}</p>
                </div>
                <div>
                  <span className="text-gray-500">Features</span>
                  <p className="font-medium">{model.features?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Run</span>
                  <p className="text-xs text-gray-500 truncate">{new Date(model.lastRun).toLocaleString()}</p>
                </div>
              </div>

              {/* Training Progress */}
              {model.status === 'training' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs">
                    <span>Training Progress</span>
                    <span>{model.trainingEpochs || 0}/{model.totalEpochs || 100} epochs</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 rounded-full h-2" style={{ width: `${((model.trainingEpochs || 0) / (model.totalEpochs || 100)) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{model.trainingTime || 'In progress...'}</p>
                </div>
              )}

              {selectedModel?.id === model.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">Precision</span>
                      <p className="font-medium">{model.metrics?.precision || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">Recall</span>
                      <p className="font-medium">{model.metrics?.recall || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">F1 Score</span>
                      <p className="font-medium">{model.metrics?.f1Score || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">Deployed</span>
                      <p className="font-medium">{model.deployed || 'Not Deployed'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openDetailModal(model); }}
                      className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <button className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1">
                      <Play size={14} /> Run
                    </button>
                    <button className="flex-1 bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 flex items-center justify-center gap-1">
                      <Download size={14} /> Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedModelDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeDetailModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <button 
              onClick={closeDetailModal}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
            >
              <X size={24} className="text-gray-500 hover:text-gray-700" />
            </button>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Brain size={28} className="text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedModelDetail.name}</h2>
                  <p className="text-purple-100 text-sm">{selectedModelDetail.type} · {selectedModelDetail.version}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedModelDetail.status)}`}>
                    {selectedModelDetail.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="text-sm font-medium text-green-600">{selectedModelDetail.accuracy}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Deployed</p>
                  <p className="text-sm font-medium">{selectedModelDetail.deployed || 'Not Deployed'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Features</p>
                  <p className="text-sm font-medium">{selectedModelDetail.features?.length || 0}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Layers size={14} /> Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModelDetail.features?.map((feature, idx) => (
                    <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Activity size={14} /> Model Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {selectedModelDetail.details && Object.entries(selectedModelDetail.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-1 last:border-0">
                      <span className="text-gray-500">{key}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button 
                  onClick={closeDetailModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  View Training Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLModels;