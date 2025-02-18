'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { GradientGenerator } from '@/app/utils/gradients';

// Loại bỏ tiền điện tử vì API hiện tại không hỗ trợ
const currencies = [
    { code: 'AUD', name: 'Đô la Úc' },
    { code: 'BRL', name: 'Real Brazil' },
    { code: 'CAD', name: 'Đô la Canada' },
    { code: 'CHF', name: 'Franc Thụy Sĩ' },
    { code: 'CNY', name: 'Nhân dân tệ (Trung Quốc)' },
    { code: 'DKK', name: 'Krone Đan Mạch' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'Bảng Anh' },
    { code: 'HKD', name: 'Đô la Hồng Kông' },
    { code: 'JPY', name: 'Yên Nhật' },
    { code: 'KRW', name: 'Won Hàn Quốc' },
    { code: 'MXN', name: 'Peso Mexico' },
    { code: 'MYR', name: 'Ringgit Malaysia' },
    { code: 'NOK', name: 'Krone Na Uy' },
    { code: 'NZD', name: 'Đô la New Zealand' },
    { code: 'SEK', name: 'Krona Thụy Điển' },
    { code: 'SGD', name: 'Đô la Singapore' },
    { code: 'THB', name: 'Baht Thái Lan' },
    { code: 'USD', name: 'Đô la Mỹ' },
    { code: 'VND', name: 'Việt Nam Đồng' },
];

export default function CurrencyConverter() {
    const [amount, setAmount] = useState<string>('1');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('VND');
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [allRates, setAllRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [buttonClasses, setButtonClasses] = useState('');

    useEffect(() => {
        // Tạo gradient ngẫu nhiên khi component mount
        setButtonClasses(GradientGenerator.getButtonClasses());
    }, []);

    const fetchExchangeRate = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
            );
            const data = await response.json();
            setExchangeRate(data.rates[toCurrency]);
            setAllRates(data.rates);
            // Lấy thời gian hiện tại làm thời gian cập nhật
            const now = new Date();
            setLastUpdate(now.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }));
        } catch (error) {
            console.error('Lỗi khi lấy tỉ giá:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchangeRate();
        // Cập nhật mỗi 5 phút
        const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fromCurrency, toCurrency]);

    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const convertedAmount = exchangeRate ? Number(amount) * exchangeRate : 0;

    return (
        <div className="flex items-center justify-center w-full">
            <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 m-2">
                <h1 className="text-2xl font-bold mb-4 text-center animate-gradient">
                    Chuyển đổi tiền tệ
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Phần chuyển đổi tiền tệ */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold animate-gradient">
                                Chuyển đổi
                            </h2>
                            <div className="flex flex-col space-y-2">
                                <label className="text-gray-600 dark:text-gray-300">Số tiền</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Nhập số tiền"
                                />
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <label className="text-gray-600 dark:text-gray-300">Từ</label>
                                    <select
                                        value={fromCurrency}
                                        onChange={(e) => setFromCurrency(e.target.value)}
                                        className="w-full p-2 mt-1 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        size={5}
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency.code} value={currency.code}>
                                                {currency.code} - {currency.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleSwapCurrencies}
                                    className={buttonClasses || 'flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg bg-blue-500 hover:bg-blue-600'}
                                >
                                    <ArrowLeftRight className="w-6 h-6 text-white" />
                                </button>

                                <div className="flex-1">
                                    <label className="text-gray-600 dark:text-gray-300">Đến</label>
                                    <select
                                        value={toCurrency}
                                        onChange={(e) => setToCurrency(e.target.value)}
                                        className="w-full p-2 mt-1 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        size={5}
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency.code} value={currency.code}>
                                                {currency.code} - {currency.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
                                <div className="text-center">
                                    {loading ? (
                                        <div className="text-gray-600 dark:text-gray-300">Đang tải...</div>
                                    ) : (
                                        <>
                                            <div className="text-xl font-bold text-gray-800 dark:text-white">
                                                {Number(amount).toLocaleString()} {fromCurrency} =
                                            </div>
                                            <div className="text-2xl font-bold animate-gradient-fast mt-2">
                                                {convertedAmount.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}{' '}
                                                {toCurrency}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                1 {fromCurrency} = {exchangeRate?.toFixed(4)} {toCurrency}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bảng tỉ giá */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold animate-gradient">
                                Bảng tỉ giá ({fromCurrency})
                            </h2>
                            {lastUpdate && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Cập nhật lúc: {lastUpdate}
                                </div>
                            )}
                        </div>
                        {loading ? (
                            <div className="text-center text-gray-600 dark:text-gray-300">Đang tải...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[calc(100%-3rem)] overflow-y-auto">
                                {currencies
                                    .filter((currency) => currency.code !== fromCurrency)
                                    .map((currency) => (
                                        <div
                                            key={currency.code}
                                            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                                        >
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {currency.name}
                                            </div>
                                            <div className="text-lg font-semibold text-gray-800 dark:text-white">
                                                1 {fromCurrency} = {allRates[currency.code]?.toFixed(4)} {currency.code}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 