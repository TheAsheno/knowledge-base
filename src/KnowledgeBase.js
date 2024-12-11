import React, { useState, useEffect } from 'react';

const KnowledgeBase = () => {
  const [rules, setRules] = useState([]);
  const [facts, setFacts] = useState(new Set());
  const [premisesInput, setPremisesInput] = useState('');
  const [conclusionInput, setConclusionInput] = useState('');
  const [factInput, setFactInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [result, setResult] = useState('');
  const [inferenceSteps, setInferenceSteps] = useState([]);
  const [showRules, setShowRules] = useState(false); // 新增状态变量，用于控制规则库的显示和隐藏

  useEffect(() => {
    fetch('rules.default.json')
      .then(response => response.json())
      .then(data => {
        const loadedRules = data.map(rule => ({
          premises: rule.conditions,
          conclusion: rule.results[0]
        }));
        loadedRules.sort((a, b) => b.premises.length - a.premises.length);
        setRules(loadedRules);
      })
      .catch(error => console.error('Error loading rules:', error));
  }, []);

  const addRule = () => {
    const premises = premisesInput.split(',').map(p => p.trim());
    const conclusion = conclusionInput.trim();
    if (premises.length > 0 && conclusion) {
      const newRules = [...rules, { premises, conclusion }];
      newRules.sort((a, b) => b.premises.length - a.premises.length);
      setRules(newRules);
      setPremisesInput('');
      setConclusionInput('');
    }
  };

  const deleteRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const addFact = () => {
    if (factInput) {
      setFacts(new Set(facts).add(factInput));
      setFactInput('');
    }
  };

  const clearFacts = () => {
    setFacts(new Set());
  };

  const forwardChaining = (rules, facts) => {
    let newFacts = new Set(facts);
    let addedNewFact = true;
    let steps = [];

    while (addedNewFact) {
      addedNewFact = false;
      for (const rule of rules) {
        if (rule.premises.every(premise => newFacts.has(premise))) {
          if (!newFacts.has(rule.conclusion)) {
            newFacts.add(rule.conclusion);
            steps.push(`${rule.premises.join(' AND ')} => ${rule.conclusion}`);
            addedNewFact = true;
            break;
          }
        }
      }
    }

    setInferenceSteps(steps);
    return newFacts;
  };

  const performForwardChaining = () => {
    const newFacts = forwardChaining(rules, facts);
    setFacts(newFacts);
    if (newFacts.size === facts.size) {
      setResult('无法识别');
    } else {
      setResult(`正向推理结果: ${Array.from(newFacts).join(', ')}`);
    }
  };

  const backwardChaining = (rules, facts, goal) => {
    if (facts.has(goal)) {
      return true;
    }

    for (const rule of rules) {
      if (rule.conclusion === goal) {
        if (rule.premises.every(premise => backwardChaining(rules, facts, premise))) {
          return true;
        }
      }
    }

    return false;
  };

  const performBackwardChaining = () => {
    if (goalInput) {
      const result = backwardChaining(rules, facts, goalInput);
      setResult(result ? `反向推理目标 (${goalInput}) 是否成立: ${result}` : '无法识别');
    }
  };

  return (
    <div className="container">
      <div className="section">
        <h2>规则库</h2>
        <button onClick={() => setShowRules(!showRules)}>
          {showRules ? '隐藏规则库' : '显示规则库'}
        </button>
        {showRules && (
          <div>
            <ul>
              {rules.map((rule, index) => (
                <li key={index}>
                  IF {rule.premises.join(' AND ')} THEN {rule.conclusion}
                  <button onClick={() => deleteRule(index)}>删除</button>
                </li>
              ))}
            </ul>
            <input
              type="text"
              value={premisesInput}
              onChange={(e) => setPremisesInput(e.target.value)}
              placeholder="前提 (用逗号分隔)"
            />
            <input
              type="text"
              value={conclusionInput}
              onChange={(e) => setConclusionInput(e.target.value)}
              placeholder="结论"
            />
            <button onClick={addRule}>添加规则</button>
          </div>
        )}
      </div>
      <div className="section">
        <h2>综合数据库</h2>
        <ul>
          {Array.from(facts).map((fact, index) => (
            <li key={index}>{fact}</li>
          ))}
        </ul>
        <input
          type="text"
          value={factInput}
          onChange={(e) => setFactInput(e.target.value)}
          placeholder="事实"
        />
        <button onClick={addFact}>添加事实</button>
        <button onClick={clearFacts}>清空事实</button>
      </div>
      <div className="section">
        <h2>推理</h2>
        <button onClick={performForwardChaining}>正向推理</button>
        <button onClick={performBackwardChaining}>反向推理</button>
        <input
          type="text"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="目标 (反向推理)"
        />
        <div>{result}</div>
        <div>
          <h3>推理过程</h3>
          <ul>
            {inferenceSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;