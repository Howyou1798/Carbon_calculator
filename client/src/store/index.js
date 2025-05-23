import { createStore } from 'vuex'
import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000'

export default createStore({
  state: {
    carbonFactors: [],
    scope1Factors: [],
    scope2Factors: [],
    scope3Factors: [],
    availableYears: {
      electricity: [],
      water: []
    },
    loading: false,
    error: null,
    calculationResults: {
      scope1: 0,
      scope2: 0,
      scope3: 0,
      total: 0
    },
    productEmissions: {
      total: 0,
      perUnit: 0
    }
  },
  getters: {
    getCarbonFactors: state => state.carbonFactors,
    getScope1Factors: state => state.scope1Factors,
    getScope2Factors: state => state.scope2Factors,
    getScope3Factors: state => state.scope3Factors,
    getAvailableYears: state => state.availableYears,
    getElectricityFactorsByYear: (state) => (year) => {
      return state.scope2Factors.filter(factor => 
        factor.name.includes('電力') && factor.name.includes(year)
      );
    },
    getWaterFactorsByYear: (state) => (year) => {
      return state.scope2Factors.filter(factor => 
        factor.name.includes('自來水') && factor.name.includes(year)
      );
    },
    getLoading: state => state.loading,
    getError: state => state.error,
    getCalculationResults: state => state.calculationResults,
    getProductEmissions: state => state.productEmissions
  },
  mutations: {
    SET_CARBON_FACTORS(state, factors) {
      state.carbonFactors = factors
    },
    SET_SCOPE1_FACTORS(state, factors) {
      state.scope1Factors = factors
    },
    SET_SCOPE2_FACTORS(state, factors) {
      state.scope2Factors = factors
    },
    SET_SCOPE3_FACTORS(state, factors) {
      state.scope3Factors = factors
    },
    SET_AVAILABLE_YEARS(state, years) {
      state.availableYears = years
    },
    SET_LOADING(state, status) {
      state.loading = status
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_CALCULATION_RESULTS(state, results) {
      state.calculationResults = results
    },
    SET_PRODUCT_EMISSIONS(state, emissions) {
      state.productEmissions = emissions
    }
  },
  actions: {
    async fetchCarbonFactors({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/carbon-factors`)
        if (response.data) {
          commit('SET_CARBON_FACTORS', response.data.records)
          commit('SET_SCOPE1_FACTORS', response.data.scope1)
          commit('SET_SCOPE2_FACTORS', response.data.scope2)
          commit('SET_SCOPE3_FACTORS', response.data.scope3)
          commit('SET_AVAILABLE_YEARS', response.data.years)
        } else {
          throw new Error('無效的API響應格式')
        }
      } catch (error) {
        console.error('獲取碳排放係數時出錯:', error)
        commit('SET_ERROR', '無法載入碳排放係數數據，請稍後再試。')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    calculateEmissions({ commit }, payload) {
      const { scope1Data, scope2Data, scope3Data, productionUnits } = payload
      
      // 計算範疇1、2、3的總排放量
      const scope1Total = Object.values(scope1Data).reduce((sum, item) => sum + Number(item.amount * item.factor || 0), 0)
      const scope2Total = Object.values(scope2Data).reduce((sum, item) => sum + Number(item.amount * item.factor || 0), 0)
      const scope3Total = Object.values(scope3Data).reduce((sum, item) => sum + Number(item.amount * item.factor || 0), 0)
      
      const totalEmissions = scope1Total + scope2Total + scope3Total
      
      // 計算每單位產品的碳排放
      const perUnitEmission = productionUnits > 0 ? totalEmissions / productionUnits : 0
      
      // 保存計算結果
      commit('SET_CALCULATION_RESULTS', {
        scope1: scope1Total,
        scope2: scope2Total,
        scope3: scope3Total,
        total: totalEmissions
      })
      
      commit('SET_PRODUCT_EMISSIONS', {
        total: totalEmissions,
        perUnit: perUnitEmission
      })
      
      return {
        totalEmissions,
        perUnitEmission
      }
    }
  }
}) 